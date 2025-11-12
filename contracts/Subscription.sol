// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Subscription Contract for AI Memory Box
 * @notice Manages user subscriptions with AI3 token payments
 * @dev Users pay with native AI3 tokens (tAI3 on testnet, AI3 on mainnet)
 */
contract Subscription {
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

    // Owner address (receives payments)
    address public owner;

    // User subscriptions mapping
    mapping(address => UserSubscription) public subscriptions;

    // Events
    event Subscribed(
        address indexed user,
        Plan plan,
        uint256 duration,
        uint256 expiresAt
    );

    event SubscriptionExtended(
        address indexed user,
        uint256 duration,
        uint256 newExpiresAt
    );

    event SubscriptionCancelled(address indexed user);

    event PaymentReceived(
        address indexed from,
        uint256 amount
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    /**
     * @notice Constructor - sets the contract owner
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Subscribe to a plan
     * @param _plan The subscription plan (0=FREE, 1=BASIC, 2=PRO, 3=UNLIMITED)
     * @param _duration Subscription duration in seconds
     */
    function subscribe(Plan _plan, uint256 _duration) external payable {
        require(_plan != Plan.FREE, "Use FREE plan without payment");
        require(_duration > 0, "Duration must be greater than 0");
        require(msg.value > 0, "Payment required");

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

        // Update subscription
        sub.plan = _plan;
        sub.expiresAt = expiresAt;
        sub.isActive = true;

        // Transfer payment to owner
        (bool success, ) = owner.call{value: msg.value}("");
        require(success, "Payment transfer failed");

        emit Subscribed(msg.sender, _plan, _duration, expiresAt);
        emit PaymentReceived(msg.sender, msg.value);
    }

    /**
     * @notice Extend current subscription
     * @param _duration Additional duration in seconds
     */
    function extendSubscription(uint256 _duration) external payable {
        require(_duration > 0, "Duration must be greater than 0");
        require(msg.value > 0, "Payment required");

        UserSubscription storage sub = subscriptions[msg.sender];
        require(sub.isActive, "No active subscription");
        require(sub.plan != Plan.FREE, "Cannot extend FREE plan");

        // Extend subscription
        if (sub.expiresAt > block.timestamp) {
            sub.expiresAt += _duration;
        } else {
            sub.expiresAt = block.timestamp + _duration;
        }

        // Transfer payment to owner
        (bool success, ) = owner.call{value: msg.value}("");
        require(success, "Payment transfer failed");

        emit SubscriptionExtended(msg.sender, _duration, sub.expiresAt);
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
     * @notice Transfer ownership to a new address
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }

    /**
     * @notice Fallback function to receive payments
     */
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }
}
