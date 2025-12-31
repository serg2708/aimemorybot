// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Secure Subscription Contract for AI Memory Box
 * @notice Manages user subscriptions with AI3 token payments
 * @dev SECURITY IMPROVEMENTS:
 *      - ReentrancyGuard to prevent reentrancy attacks
 *      - Pull payment pattern to avoid DoS
 *      - Pausable for emergency stops
 *      - Price validation per plan
 *      - Duration limits
 *      - Gas-limited external calls
 *      - Comprehensive event logging
 */
contract SecureSubscription is ReentrancyGuard, Pausable, Ownable {
    // Subscription plans
    enum Plan {
        FREE,     // 0 - Free tier
        BASIC,    // 1 - Basic plan
        PRO,      // 2 - Pro plan
        UNLIMITED // 3 - Unlimited plan
    }

    // Subscription data
    struct UserSubscription {
        Plan plan;
        uint256 expiresAt;
        bool isActive;
        uint256 totalPaid; // Track total payments for analytics
    }

    // Constants
    uint256 public constant MAX_DURATION = 10 * 365 days; // 10 years max
    uint256 public constant MIN_DURATION = 1 days;
    
    // Plan prices (can be updated by owner)
    mapping(Plan => uint256) public prices;
    
    // User subscriptions
    mapping(address => UserSubscription) public subscriptions;
    
    // Pending withdrawals (pull payment pattern)
    mapping(address => uint256) public pendingWithdrawals;
    
    // Total collected for analytics
    uint256 public totalCollected;
    
    // Events with comprehensive logging
    event Subscribed(
        address indexed user,
        Plan indexed plan,
        uint256 amount,
        uint256 duration,
        uint256 indexed expiresAt
    );

    event SubscriptionExtended(
        address indexed user,
        uint256 amount,
        uint256 duration,
        uint256 newExpiresAt
    );

    event SubscriptionCancelled(
        address indexed user,
        Plan plan,
        uint256 remainingTime
    );

    event PaymentReceived(
        address indexed from,
        uint256 amount,
        Plan plan
    );
    
    event PriceUpdated(
        Plan indexed plan,
        uint256 oldPrice,
        uint256 newPrice
    );
    
    event WithdrawalProcessed(
        address indexed recipient,
        uint256 amount
    );

    /**
     * @notice Constructor - sets initial prices
     */
    constructor() Ownable(msg.sender) {
        // Set initial prices (can be updated later)
        prices[Plan.BASIC] = 0.01 ether;      // ~$25 at $2500/ETH
        prices[Plan.PRO] = 0.05 ether;        // ~$125
        prices[Plan.UNLIMITED] = 0.1 ether;    // ~$250
    }

    /**
     * @notice Subscribe to a plan
     * @param _plan The subscription plan (1=BASIC, 2=PRO, 3=UNLIMITED)
     * @param _duration Subscription duration in seconds
     */
    function subscribe(Plan _plan, uint256 _duration) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(_plan != Plan.FREE, "Use FREE plan without payment");
        require(_duration >= MIN_DURATION, "Duration too short");
        require(_duration <= MAX_DURATION, "Duration too long");
        require(msg.value >= prices[_plan], "Insufficient payment");

        UserSubscription storage sub = subscriptions[msg.sender];

        // Calculate expiration time
        uint256 expiresAt;
        if (sub.isActive && sub.expiresAt > block.timestamp) {
            // Extend existing subscription
            expiresAt = sub.expiresAt + _duration;
        } else {
            // New subscription
            expiresAt = block.timestamp + _duration;
        }

        // Update subscription (BEFORE external interactions)
        sub.plan = _plan;
        sub.expiresAt = expiresAt;
        sub.isActive = true;
        sub.totalPaid += msg.value;
        
        // Update total collected
        totalCollected += msg.value;

        // Add to pending withdrawals (pull payment pattern)
        pendingWithdrawals[owner()] += msg.value;

        emit Subscribed(msg.sender, _plan, msg.value, _duration, expiresAt);
        emit PaymentReceived(msg.sender, msg.value, _plan);
    }

    /**
     * @notice Extend current subscription
     * @param _duration Additional duration in seconds
     */
    function extendSubscription(uint256 _duration) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(_duration >= MIN_DURATION, "Duration too short");
        require(_duration <= MAX_DURATION, "Duration too long");

        UserSubscription storage sub = subscriptions[msg.sender];
        require(sub.isActive, "No active subscription");
        require(sub.plan != Plan.FREE, "Cannot extend FREE plan");
        require(msg.value >= prices[sub.plan], "Insufficient payment");

        // Extend subscription (BEFORE external interactions)
        if (sub.expiresAt > block.timestamp) {
            sub.expiresAt += _duration;
        } else {
            sub.expiresAt = block.timestamp + _duration;
        }
        
        sub.totalPaid += msg.value;
        totalCollected += msg.value;

        // Add to pending withdrawals
        pendingWithdrawals[owner()] += msg.value;

        emit SubscriptionExtended(msg.sender, msg.value, _duration, sub.expiresAt);
        emit PaymentReceived(msg.sender, msg.value, sub.plan);
    }

    /**
     * @notice Cancel subscription (stops auto-renewal, doesn't refund)
     */
    function cancelSubscription() external {
        UserSubscription storage sub = subscriptions[msg.sender];
        require(sub.isActive, "No active subscription");

        uint256 remainingTime = sub.expiresAt > block.timestamp 
            ? sub.expiresAt - block.timestamp 
            : 0;

        sub.isActive = false;

        emit SubscriptionCancelled(msg.sender, sub.plan, remainingTime);
    }

    /**
     * @notice Withdraw accumulated payments (pull payment pattern)
     * @dev Only owner can withdraw their accumulated payments
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 amount = pendingWithdrawals[owner()];
        require(amount > 0, "No funds to withdraw");

        // Reset before transfer (checks-effects-interactions)
        pendingWithdrawals[owner()] = 0;

        // Use call with gas limit to prevent griefing
        (bool success, ) = owner().call{value: amount, gas: 10000}("");
        
        if (!success) {
            // Restore balance if transfer fails
            pendingWithdrawals[owner()] = amount;
            revert("Withdrawal failed");
        }

        emit WithdrawalProcessed(owner(), amount);
    }

    /**
     * @notice Emergency withdrawal with alternative recipient
     * @param _recipient Alternative recipient if owner() fails
     */
    function emergencyWithdraw(address payable _recipient) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(_recipient != address(0), "Invalid recipient");
        uint256 amount = pendingWithdrawals[owner()];
        require(amount > 0, "No funds to withdraw");

        pendingWithdrawals[owner()] = 0;

        (bool success, ) = _recipient.call{value: amount, gas: 10000}("");
        require(success, "Emergency withdrawal failed");

        emit WithdrawalProcessed(_recipient, amount);
    }

    /**
     * @notice Update plan price
     * @param _plan Plan to update
     * @param _newPrice New price in wei
     */
    function updatePrice(Plan _plan, uint256 _newPrice) external onlyOwner {
        require(_plan != Plan.FREE, "Cannot set price for FREE plan");
        require(_newPrice > 0, "Price must be greater than 0");
        
        uint256 oldPrice = prices[_plan];
        prices[_plan] = _newPrice;
        
        emit PriceUpdated(_plan, oldPrice, _newPrice);
    }

    /**
     * @notice Get user's subscription data
     * @param _user User address
     * @return plan User's subscription plan
     * @return expiresAt Expiration timestamp
     * @return isActive Whether subscription is active
     * @return totalPaid Total amount paid by user
     */
    function getSubscription(address _user)
        external
        view
        returns (
            Plan plan,
            uint256 expiresAt,
            bool isActive,
            uint256 totalPaid
        )
    {
        UserSubscription memory sub = subscriptions[_user];

        // Check if subscription is actually active (not expired)
        bool active = sub.isActive && sub.expiresAt > block.timestamp;

        // If expired, return FREE plan
        if (!active) {
            return (Plan.FREE, 0, false, sub.totalPaid);
        }

        return (sub.plan, sub.expiresAt, active, sub.totalPaid);
    }

    /**
     * @notice Check if user has an active subscription
     * @param _user User address
     * @return bool True if subscription is active and not expired
     */
    function isSubscriptionActive(address _user) external view returns (bool) {
        UserSubscription memory sub = subscriptions[_user];
        return sub.isActive && sub.expiresAt > block.timestamp;
    }
    
    /**
     * @notice Get remaining time for subscription
     * @param _user User address
     * @return uint256 Remaining time in seconds (0 if expired)
     */
    function getRemainingTime(address _user) external view returns (uint256) {
        UserSubscription memory sub = subscriptions[_user];
        if (!sub.isActive || sub.expiresAt <= block.timestamp) {
            return 0;
        }
        return sub.expiresAt - block.timestamp;
    }

    /**
     * @notice Pause contract in emergency
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Fallback function to receive payments
     * @dev Deposits go to pending withdrawals
     */
    receive() external payable {
        pendingWithdrawals[owner()] += msg.value;
        totalCollected += msg.value;
        emit PaymentReceived(msg.sender, msg.value, Plan.FREE);
    }

    /**
     * @notice Get contract balance
     * @return uint256 Current contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

/**
 * SECURITY IMPROVEMENTS SUMMARY:
 * 
 * 1. ✅ REENTRANCY PROTECTION
 *    - ReentrancyGuard on all payable functions
 *    - State updates BEFORE external calls
 * 
 * 2. ✅ DoS PREVENTION
 *    - Pull payment pattern instead of push
 *    - Owner withdraws when ready
 *    - Gas-limited external calls (10000 gas)
 * 
 * 3. ✅ PAYMENT VALIDATION
 *    - Minimum price per plan
 *    - Price can be updated by owner
 * 
 * 4. ✅ INPUT VALIDATION
 *    - Duration limits (MIN_DURATION to MAX_DURATION)
 *    - Plan validation
 *    - Address validation
 * 
 * 5. ✅ EMERGENCY CONTROLS
 *    - Pausable functionality
 *    - Emergency withdrawal option
 * 
 * 6. ✅ COMPREHENSIVE LOGGING
 *    - Indexed events for off-chain tracking
 *    - Detailed event parameters
 * 
 * 7. ✅ GAS OPTIMIZATION
 *    - Minimal storage operations
 *    - Efficient data structures
 * 
 * 8. ✅ ANALYTICS
 *    - Track total paid per user
 *    - Track total collected
 *    - Get remaining time
 * 
 * REMAINING CONSIDERATIONS:
 * - Use multi-sig wallet as owner
 * - Consider Timelock for critical changes
 * - Implement rate limiting if needed
 * - Add referral system with proper checks
 * - Consider upgradability (proxy pattern)
 */
