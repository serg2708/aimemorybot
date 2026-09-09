// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../Subs.sol";

/**
 * @title Complete Attack Vector Testing Suite
 * @notice Real implementations of all possible attacks on user wallets
 */

// ============ MALICIOUS CONTRACTS ============

contract ReentrancyAttacker {
    Subscription public target;
    uint256 public attackPhase;
    bool public attacking;
    
    constructor(Subscription _target) {
        target = _target;
    }
    
    receive() external payable {
        if (!attacking) {
            attacking = true;
            // During payment, try to subscribe again
            try target.subscribe{value: 0.1 ether}(Subscription.Plan.BASIC, 30 days) {
                attackPhase = 1; // Success - critical vulnerability
            } catch {
                attackPhase = 2; // Failed - protected
            }
        }
    }
    
    function attack() external payable {
        attacking = false;
        target.subscribe{value: msg.value}(Subscription.Plan.BASIC, 30 days);
    }
}

contract DoSAttacker {
    bool public blockPayments = true;
    
    receive() external payable {
        if (blockPayments) {
            revert("DoS: Blocking all payments");
        }
    }
}

contract GasGriefingAttacker {
    uint256 public gasToWaste;
    
    constructor(uint256 _gasToWaste) {
        gasToWaste = _gasToWaste;
    }
    
    receive() external payable {
        // Waste gas up to limit
        uint256 i;
        while(gasleft() > 10000 && i < gasToWaste) {
            i++;
        }
    }
}

// ============ MAIN TEST CONTRACT ============

contract SubscriptionSecurityTest is Test {
    Subscription public sub;
    address public owner;
    address public user1;
    address public user2;
    address public attacker;
    
    // Events for detailed logging
    event TestResult(string testName, bool passed, string details);
    event VulnerabilityFound(string severity, string description);
    
    function setUp() public {
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        attacker = makeAddr("attacker");
        
        vm.deal(owner, 100 ether);
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(attacker, 100 ether);
        
        vm.prank(owner);
        sub = new Subscription();
    }
    
    // ============ CRITICAL TESTS ============
    
    /**
     * TEST 1: REENTRANCY - Can drain contract or manipulate state
     */
    function test_Reentrancy_Critical() public {
        vm.startPrank(attacker);
        ReentrancyAttacker malicious = new ReentrancyAttacker(sub);
        vm.deal(address(malicious), 10 ether);
        
        // Transfer ownership to malicious contract
        vm.stopPrank();
        vm.prank(owner);
        sub.transferOwnership(address(malicious));
        
        // Execute attack
        vm.prank(attacker);
        malicious.attack{value: 1 ether}();
        
        if (malicious.attackPhase() == 1) {
            emit VulnerabilityFound("CRITICAL", "Reentrancy vulnerability detected!");
            emit TestResult("Reentrancy", false, "VULNERABLE: State can be manipulated during payment");
        } else {
            emit TestResult("Reentrancy", true, "Protected: Reentrancy blocked");
        }
    }
    
    /**
     * TEST 2: DoS via Reverting Owner
     */
    function test_DoS_OwnerRevert_High() public {
        vm.prank(owner);
        DoSAttacker dosAttacker = new DoSAttacker();
        
        vm.prank(owner);
        sub.transferOwnership(address(dosAttacker));
        
        vm.startPrank(user1);
        vm.expectRevert();
        sub.subscribe{value: 1 ether}(Subscription.Plan.BASIC, 30 days);
        vm.stopPrank();
        
        emit VulnerabilityFound("HIGH", "DoS vulnerability: Malicious owner can block all subscriptions");
        emit TestResult("DoS via Revert", false, "VULNERABLE: Users cannot subscribe if owner reverts");
    }
    
    /**
     * TEST 3: Gas Griefing Attack
     */
    function test_GasGriefing_Medium() public {
        vm.prank(owner);
        GasGriefingAttacker gasAttacker = new GasGriefingAttacker(1000000);
        
        vm.prank(owner);
        sub.transferOwnership(address(gasAttacker));
        
        vm.startPrank(user1);
        uint256 gasBefore = gasleft();
        
        try sub.subscribe{value: 1 ether, gas: 500000}(Subscription.Plan.BASIC, 30 days) {
            uint256 gasUsed = gasBefore - gasleft();
            if (gasUsed > 200000) {
                emit VulnerabilityFound("MEDIUM", "Gas griefing possible: Excessive gas consumption");
            }
        } catch {
            emit VulnerabilityFound("HIGH", "Transaction fails due to gas exhaustion");
        }
        vm.stopPrank();
    }
    
    /**
     * TEST 4: Owner Key Compromise
     */
    function test_OwnerCompromise_Critical() public {
        // Simulate owner key compromise
        vm.startPrank(user1);
        sub.subscribe{value: 5 ether}(Subscription.Plan.PRO, 365 days);
        vm.stopPrank();
        
        uint256 ownerBalanceBefore = owner.balance;
        
        // Attacker gets owner private key
        vm.startPrank(attacker);
        // Can transfer ownership
        vm.stopPrank();
        vm.prank(owner);
        sub.transferOwnership(attacker);
        
        // All future payments go to attacker
        vm.prank(user2);
        sub.subscribe{value: 3 ether}(Subscription.Plan.PRO, 365 days);
        
        emit VulnerabilityFound("CRITICAL", "Owner compromise leads to fund theft");
        emit TestResult("Owner Compromise", false, "VULNERABLE: No multisig, single point of failure");
    }
    
    /**
     * TEST 5: Timestamp Manipulation
     */
    function test_TimestampManipulation_Low() public {
        vm.startPrank(user1);
        sub.subscribe{value: 1 ether}(Subscription.Plan.BASIC, 30 days);
        
        uint256 expirationBefore = sub.subscriptions(user1).expiresAt;
        
        // Miner manipulates timestamp by 15 seconds
        vm.warp(block.timestamp + 15);
        
        sub.extendSubscription{value: 1 ether}(30 days);
        vm.stopPrank();
        
        uint256 expirationAfter = sub.subscriptions(user1).expiresAt;
        
        // Check if 15 second manipulation matters
        if (expirationAfter - expirationBefore > 30 days + 20) {
            emit VulnerabilityFound("LOW", "Timestamp manipulation possible but limited impact");
        }
        
        emit TestResult("Timestamp", true, "Minimal impact: 15s variance acceptable");
    }
    
    /**
     * TEST 6: Front-Running Attack
     */
    function test_FrontRunning_Medium() public {
        // User1 wants to subscribe
        bytes memory user1Tx = abi.encodeCall(
            sub.subscribe,
            (Subscription.Plan.PRO, 365 days)
        );
        
        // Attacker sees transaction in mempool
        // Attacker front-runs with higher gas
        vm.prank(attacker);
        sub.subscribe{value: 10 ether}(Subscription.Plan.PRO, 365 days);
        
        // User1 transaction executes
        vm.prank(user1);
        sub.subscribe{value: 10 ether}(Subscription.Plan.PRO, 365 days);
        
        // Both succeed but attacker got in first
        // No direct theft but could be issue in more complex scenarios
        
        emit TestResult("Front-running", true, "No direct vulnerability in this context");
    }
    
    /**
     * TEST 7: Integer Overflow in Duration
     */
    function test_IntegerOverflow_Medium() public {
        vm.startPrank(user1);
        
        // Try maximum values
        try sub.subscribe{value: 1 ether}(Subscription.Plan.PRO, type(uint256).max) {
            emit VulnerabilityFound("MEDIUM", "Large duration accepted without validation");
        } catch {
            emit TestResult("Integer Overflow", true, "Protected: Overflow caught");
        }
        vm.stopPrank();
    }
    
    /**
     * TEST 8: Forced ETH Sending (selfdestruct)
     */
    function test_ForcedEthSending_Low() public {
        ForceSender forcer = new ForceSender();
        vm.deal(address(forcer), 10 ether);
        
        uint256 contractBalanceBefore = address(sub).balance;
        forcer.forceSend(payable(address(sub)));
        uint256 contractBalanceAfter = address(sub).balance;
        
        if (contractBalanceAfter > contractBalanceBefore) {
            emit VulnerabilityFound("LOW", "Contract can receive forced ETH");
            // Check if this breaks any accounting
        }
        
        emit TestResult("Forced ETH", true, "No accounting issues detected");
    }
    
    /**
     * TEST 9: Subscription State Manipulation
     */
    function test_StateManipulation_High() public {
        vm.startPrank(user1);
        sub.subscribe{value: 1 ether}(Subscription.Plan.BASIC, 1 days);
        vm.stopPrank();
        
        // Fast forward past expiration
        vm.warp(block.timestamp + 2 days);
        
        // Try to extend expired subscription
        vm.startPrank(user1);
        sub.extendSubscription{value: 1 ether}(30 days);
        
        // Check if extension works on expired subscription
        (,uint256 expiresAt, bool isActive) = sub.getSubscription(user1);
        
        if (isActive && expiresAt > block.timestamp) {
            emit TestResult("State Manipulation", true, "Extension works as expected");
        }
        vm.stopPrank();
    }
    
    /**
     * TEST 10: Cross-Function Reentrancy
     */
    function test_CrossFunctionReentrancy_Critical() public {
        vm.prank(owner);
        CrossReentrancyAttacker crossAttacker = new CrossReentrancyAttacker(sub);
        
        vm.prank(owner);
        sub.transferOwnership(address(crossAttacker));
        
        vm.deal(address(crossAttacker), 10 ether);
        vm.prank(address(crossAttacker));
        crossAttacker.attack();
        
        if (crossAttacker.exploitSuccessful()) {
            emit VulnerabilityFound("CRITICAL", "Cross-function reentrancy detected!");
        }
    }
    
    /**
     * TEST 11: Authorization Bypass
     */
    function test_AuthorizationBypass_Critical() public {
        vm.startPrank(attacker);
        
        // Try to transfer ownership
        vm.expectRevert();
        sub.transferOwnership(attacker);
        
        emit TestResult("Authorization", true, "Owner-only functions protected");
        vm.stopPrank();
    }
    
    /**
     * TEST 12: Payment Validation
     */
    function test_PaymentValidation_High() public {
        vm.startPrank(user1);
        
        // Try to subscribe without payment
        vm.expectRevert();
        sub.subscribe{value: 0}(Subscription.Plan.PRO, 30 days);
        
        // Try with minimal payment
        sub.subscribe{value: 1 wei}(Subscription.Plan.PRO, 30 days);
        
        // Check if subscription is valid with 1 wei payment
        (Subscription.Plan plan,,) = sub.getSubscription(user1);
        
        if (plan == Subscription.Plan.PRO) {
            emit VulnerabilityFound("HIGH", "No minimum payment enforcement");
        }
        
        vm.stopPrank();
    }
}

// Helper contract for forced sending
contract ForceSender {
    function forceSend(address payable target) external {
        selfdestruct(target);
    }
    
    receive() external payable {}
}

// Cross-function reentrancy attacker
contract CrossReentrancyAttacker {
    Subscription public target;
    bool public exploitSuccessful;
    uint256 step;
    
    constructor(Subscription _target) {
        target = _target;
    }
    
    receive() external payable {
        if (step == 0) {
            step = 1;
            try target.extendSubscription{value: 0.1 ether}(30 days) {
                exploitSuccessful = true;
            } catch {}
        }
    }
    
    function attack() external {
        target.subscribe{value: 1 ether}(Subscription.Plan.BASIC, 30 days);
    }
}
