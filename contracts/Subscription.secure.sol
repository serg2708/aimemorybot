// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Subscription Contract for AI Memory Box (SECURE VERSION)
 * @notice Manages user subscriptions with AI3 token payments
 * @dev Uses OpenZeppelin security modules and pull payment pattern
 *
 * SECURITY IMPROVEMENTS:
 * - ReentrancyGuard: Prevents reentrancy attacks
 * - Ownable2Step: Two-step ownership transfer
 * - Pausable: Emergency stop mechanism
 * - Pull Payment Pattern: Prevents DoS attacks
 */
contract SubscriptionSecure is Ownable2Step, ReentrancyGuard, Pausable {
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
    }

    // User subscriptions mapping
    mapping(address => UserSubscription) public subscriptions;

    // Pull payment pattern - pending withdrawals for owner
    uint256 public pendingWithdrawal;

    // Rate limiting - subscriptions per address per day
    mapping(address => uint256) public lastSubscriptionTime;
    uint256 public constant RATE_LIMIT_PERIOD = 1 hours;

    // Events
    event Subscribed(
        address indexed user,
        Plan plan,
        uint256 duration,
        uint256 expiresAt,
        uint256 amount
    );

    event SubscriptionExtended(
        address indexed user,
        uint256 duration,
        uint256 newExpiresAt,
        uint256 amount
    );

    event SubscriptionCancelled(address indexed user);

    event PaymentReceived(
        address indexed from,
        uint256 amount
    );

    event FundsWithdrawn(
        address indexed to,
        uint256 amount
    );

    /**
     * @notice Constructor - sets the contract owner
     */
    constructor() Ownable(msg.sender) {
        // Owner is set by Ownable(msg.sender) constructor
    }

    /**
     * @notice Subscribe to a plan
     * @param _plan The subscription plan (0=FREE, 1=BASIC, 2=PRO, 3=UNLIMITED)
     * @param _duration Subscription duration in seconds
     */
    function subscribe(Plan _plan, uint256 _duration)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        // Input validation
        require(_plan != Plan.FREE, "Use FREE plan without payment");
        require(_duration > 0, "Duration must be greater than 0");
        require(msg.value > 0, "Payment required");

        // Rate limiting check
        require(
            block.timestamp >= lastSubscriptionTime[msg.sender] + RATE_LIMIT_PERIOD,
            "Rate limit exceeded"
        );

        UserSubscription storage sub = subscriptions[msg.sender];

        // Calculate expiration time (Checks-Effects-Interactions pattern)
        uint256 expiresAt;
        if (sub.isActive && sub.expiresAt > block.timestamp) {
            // Extend existing subscription
            // Check for overflow (though Solidity 0.8+ does this automatically)
            require(
                sub.expiresAt <= type(uint256).max - _duration,
                "Duration overflow"
            );
            expiresAt = sub.expiresAt + _duration;
        } else {
            // New subscription
            require(
                block.timestamp <= type(uint256).max - _duration,
                "Duration overflow"
            );
            expiresAt = block.timestamp + _duration;
        }

        // EFFECTS: Update state BEFORE external interactions
        sub.plan = _plan;
        sub.expiresAt = expiresAt;
        sub.isActive = true;
        lastSubscriptionTime[msg.sender] = block.timestamp;

        // Store payment for owner to withdraw (Pull Payment Pattern)
        pendingWithdrawal += msg.value;

        // Emit events
        emit Subscribed(msg.sender, _plan, _duration, expiresAt, msg.value);
        emit PaymentReceived(msg.sender, msg.value);
    }

    /**
     * @notice Extend current subscription
     * @param _duration Additional duration in seconds
     */
    function extendSubscription(uint256 _duration)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        // Input validation
        require(_duration > 0, "Duration must be greater than 0");
        require(msg.value > 0, "Payment required");

        UserSubscription storage sub = subscriptions[msg.sender];
        require(sub.isActive, "No active subscription");
        require(sub.plan != Plan.FREE, "Cannot extend FREE plan");

        // Rate limiting check
        require(
            block.timestamp >= lastSubscriptionTime[msg.sender] + RATE_LIMIT_PERIOD,
            "Rate limit exceeded"
        );

        // EFFECTS: Update state BEFORE external interactions
        if (sub.expiresAt > block.timestamp) {
            require(
                sub.expiresAt <= type(uint256).max - _duration,
                "Duration overflow"
            );
            sub.expiresAt += _duration;
        } else {
            require(
                block.timestamp <= type(uint256).max - _duration,
                "Duration overflow"
            );
            sub.expiresAt = block.timestamp + _duration;
        }
        lastSubscriptionTime[msg.sender] = block.timestamp;

        // Store payment for owner to withdraw (Pull Payment Pattern)
        pendingWithdrawal += msg.value;

        // Emit events
        emit SubscriptionExtended(msg.sender, _duration, sub.expiresAt, msg.value);
        emit PaymentReceived(msg.sender, msg.value);
    }

    /**
     * @notice Cancel subscription (stops auto-renewal, doesn't refund)
     */
    function cancelSubscription() external {
        UserSubscription storage sub = subscriptions[msg.sender];
        require(sub.isActive, "No active subscription");

        sub.isActive = false;

        emit SubscriptionCancelled(msg.sender);
    }

    /**
     * @notice Owner withdraws accumulated payments (Pull Payment Pattern)
     * @dev Prevents DoS attacks from malicious owner contract
     */
    function withdrawFunds() external onlyOwner nonReentrant {
        uint256 amount = pendingWithdrawal;
        require(amount > 0, "No funds to withdraw");

        // EFFECTS: Reset before external call
        pendingWithdrawal = 0;

        // INTERACTIONS: Transfer funds
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdrawal failed");

        emit FundsWithdrawn(owner(), amount);
    }

    /**
     * @notice Emergency withdraw in case contract needs to be upgraded
     * @dev Only callable when paused
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");

        pendingWithdrawal = 0; // Reset pending withdrawals

        (bool success, ) = owner().call{value: balance}("");
        require(success, "Emergency withdrawal failed");

        emit FundsWithdrawn(owner(), balance);
    }

    /**
     * @notice Get user's subscription data
     * @param _user User address
     * @return plan User's subscription plan
     * @return expiresAt Expiration timestamp
     * @return isActive Whether subscription is active
     */
    function getSubscription(address _user)
        external
        view
        returns (
            Plan plan,
            uint256 expiresAt,
            bool isActive
        )
    {
        UserSubscription memory sub = subscriptions[_user];

        // Check if subscription is actually active (not expired)
        bool active = sub.isActive && sub.expiresAt > block.timestamp;

        // If expired, return FREE plan
        if (!active) {
            return (Plan.FREE, 0, false);
        }

        return (sub.plan, sub.expiresAt, active);
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
     * @notice Pause contract in case of emergency
     * @dev Only owner can pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract after emergency is resolved
     * @dev Only owner can unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Get pending withdrawal amount
     * @return uint256 Amount pending for owner withdrawal
     */
    function getPendingWithdrawal() external view returns (uint256) {
        return pendingWithdrawal;
    }

    /**
     * @notice Check rate limit status for an address
     * @param _user User address to check
     * @return canSubscribe Whether user can subscribe now
     * @return timeUntilNext Seconds until rate limit resets
     */
    function getRateLimitStatus(address _user)
        external
        view
        returns (bool canSubscribe, uint256 timeUntilNext)
    {
        uint256 lastTime = lastSubscriptionTime[_user];
        uint256 nextAllowedTime = lastTime + RATE_LIMIT_PERIOD;

        if (block.timestamp >= nextAllowedTime) {
            return (true, 0);
        } else {
            return (false, nextAllowedTime - block.timestamp);
        }
    }

    /**
     * @notice Fallback function to receive payments
     */
    receive() external payable {
        pendingWithdrawal += msg.value;
        emit PaymentReceived(msg.sender, msg.value);
    }
}
