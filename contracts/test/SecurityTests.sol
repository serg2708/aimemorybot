// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../Subscription.sol";

/**
 * @title Malicious Contracts for Security Testing
 * @notice These contracts simulate various attack vectors
 */

/**
 * @dev Contract that attempts reentrancy attack
 */
contract ReentrancyAttacker {
    Subscription public victim;
    uint256 public attackCount;
    uint256 public maxAttacks = 3;

    constructor(address _victim) {
        victim = Subscription(_victim);
    }

    receive() external payable {
        attackCount++;
        if (attackCount < maxAttacks && address(victim).balance > 0) {
            // Try to call subscribe again during payment callback
            try victim.subscribe{value: 0.1 ether}(
                Subscription.Plan.BASIC,
                30 days
            ) {
                // Attack succeeded
            } catch {
                // Attack failed (good!)
            }
        }
    }

    function attack() external payable {
        require(msg.value >= 0.1 ether, "Need funds for attack");
        victim.subscribe{value: 0.1 ether}(
            Subscription.Plan.BASIC,
            30 days
        );
    }

    function reset() external {
        attackCount = 0;
    }
}

/**
 * @dev Contract that always reverts on receive (DoS attack)
 */
contract RevertingOwner {
    bool public shouldRevert = true;

    receive() external payable {
        if (shouldRevert) {
            revert("DoS attack - always revert");
        }
    }

    function setShouldRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }

    function withdraw() external {
        payable(msg.sender).transfer(address(this).balance);
    }
}

/**
 * @dev Contract that consumes all gas on receive
 */
contract GasGriefingAttacker {
    receive() external payable {
        // Consume all gas with infinite loop
        while(true) {
            // This should cause out of gas
        }
    }
}

/**
 * @dev Contract for selfdestruct griefing
 */
contract SelfdestructGriefing {
    function attack(address payable target) external payable {
        // Force send ether via selfdestruct
        selfdestruct(target);
    }
}

/**
 * @dev Contract that attempts front-running
 */
contract FrontRunner {
    Subscription public victim;

    constructor(address _victim) {
        victim = Subscription(_victim);
    }

    // Monitor mempool and front-run subscriptions
    function frontRun(
        Subscription.Plan plan,
        uint256 duration
    ) external payable {
        // This would normally be called by bot watching mempool
        victim.subscribe{value: msg.value}(plan, duration);
    }
}

/**
 * @dev Contract that attempts integer overflow
 */
contract OverflowAttacker {
    Subscription public victim;

    constructor(address _victim) {
        victim = Subscription(_victim);
    }

    function attemptOverflow() external payable {
        // Try to overflow expiresAt
        uint256 maxDuration = type(uint256).max;

        try victim.subscribe{value: msg.value}(
            Subscription.Plan.BASIC,
            maxDuration
        ) {
            // Should not succeed
            revert("Overflow attack succeeded - BAD!");
        } catch {
            // Expected to fail
        }
    }

    function attemptUnderflow() external {
        // Try to underflow by cancelling non-existent subscription
        try victim.cancelSubscription() {
            // Might succeed if no checks
        } catch {
            // Expected behavior
        }
    }
}

/**
 * @dev Contract for testing access control
 */
contract UnauthorizedCaller {
    Subscription public victim;

    constructor(address _victim) {
        victim = Subscription(_victim);
    }

    function attemptOwnershipTakeover(address newOwner) external {
        try victim.transferOwnership(newOwner) {
            revert("Unauthorized ownership transfer succeeded - BAD!");
        } catch {
            // Expected to fail
        }
    }
}

/**
 * @dev Helper contract for testing legitimate scenarios
 */
contract LegitimateUser {
    Subscription public subscription;

    constructor(address _subscription) {
        subscription = Subscription(_subscription);
    }

    function subscribe(
        Subscription.Plan plan,
        uint256 duration
    ) external payable {
        subscription.subscribe{value: msg.value}(plan, duration);
    }

    function extend(uint256 duration) external payable {
        subscription.extendSubscription{value: msg.value}(duration);
    }

    function cancel() external {
        subscription.cancelSubscription();
    }

    function getSubscription() external view returns (
        Subscription.Plan,
        uint256,
        bool
    ) {
        return subscription.getSubscription(address(this));
    }

    receive() external payable {}
}

/**
 * @dev Contract for testing timestamp manipulation
 */
contract TimestampManipulator {
    Subscription public victim;
    uint256 public fakeTimestamp;

    constructor(address _victim) {
        victim = Victim(_victim);
    }

    // Note: In reality, only miners can manipulate block.timestamp
    // This is just to demonstrate the concept
    function subscribeWithFakeTime(
        Subscription.Plan plan,
        uint256 duration
    ) external payable {
        // In real attack, miner would manipulate block.timestamp
        // We can't actually do this in a test contract
        victim.subscribe{value: msg.value}(plan, duration);
    }
}
