// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Course {
    // 课程结构体
    struct CourseInfo {
        string title;           // 课程标题
        string description;     // 课程描述
        address author;         // 课程作者
        uint256 price;          // 课程价格（wei）
        uint256 createdAt;      // 创建时间
    }
    
    // 课程ID到课程信息的映射
    mapping(uint256 => CourseInfo) public courses;
    
    // 课程ID到购买者地址列表的映射
    mapping(uint256 => address[]) public courseBuyers;
    
    // 地址到已购买课程ID列表的映射
    mapping(address => uint256[]) public userPurchasedCourses;
    
    // 课程计数器
    uint256 public courseCounter;
    // 事件
    event CourseCreated(uint256 indexed courseId, string title, address indexed author, uint256 price);
    event CoursePurchased(uint256 indexed courseId, address indexed buyer, uint256 price);
    
    // 创建课程
    function createCourse(
        string memory _title,
        string memory _description,
        uint256 _price
    ) public returns (uint256) {
        require(bytes(_title).length > 0, unicode"课程标题不能为空");
        require(_price >= 0, unicode"课程价格不能为负数");
        
        courseCounter++;
        uint256 courseId = courseCounter;
        
        courses[courseId] = CourseInfo({
            title: _title,
            description: _description,
            author: msg.sender,
            price: _price,
            createdAt: block.timestamp
        });
        
        emit CourseCreated(courseId, _title, msg.sender, _price);
        return courseId;
    }

    // 购买课程
    function purchaseCourse(uint256 _courseId) public payable {
        require(_courseId > 0 && _courseId <= courseCounter, unicode"课程不存在1");
        require(msg.value >= courses[_courseId].price, unicode"支付金额不足");
        require(courses[_courseId].author != msg.sender, unicode"不能购买自己的课程1");
        
        // 检查是否已经购买过
        address[] storage buyers = courseBuyers[_courseId];
        for (uint i = 0; i < buyers.length; i++) {
            require(buyers[i] != msg.sender, unicode"已经购买过此课程");
        }
        
        // 记录购买者
        courseBuyers[_courseId].push(msg.sender);
        userPurchasedCourses[msg.sender].push(_courseId);
        
        // 转账给作者
        address author = courses[_courseId].author;
        payable(author).transfer(msg.value);
        
        emit CoursePurchased(_courseId, msg.sender, msg.value);
    }
    
    // 获取课程信息
    function getCourse(uint256 _courseId) public view returns (
        string memory title,
        string memory description,
        address author,
        uint256 price,
        uint256 createdAt
    ) {
        require(_courseId > 0 && _courseId <= courseCounter, unicode"课程不存在");
        CourseInfo memory course = courses[_courseId];
        return (
            course.title,
            course.description,
            course.author,
            course.price,
            course.createdAt
        );
    }
    
    // 获取课程的购买者列表
    function getCourseBuyers(uint256 _courseId) public view returns (address[] memory) {
        require(_courseId > 0 && _courseId <= courseCounter, unicode"课程不存在");
        return courseBuyers[_courseId];
    }
    
    // 获取用户购买的课程列表
    function getUserPurchasedCourses(address _user) public view returns (uint256[] memory) {
        return userPurchasedCourses[_user];
    }
    
    // 检查用户是否购买了特定课程
    function hasUserPurchasedCourse(uint256 _courseId, address _user) public view returns (bool) {
        require(_courseId > 0 && _courseId <= courseCounter, unicode"课程不存在");
        address[] storage buyers = courseBuyers[_courseId];
        for (uint i = 0; i < buyers.length; i++) {
            if (buyers[i] == _user) {
                return true;
            }
        }
        return false;
    }
    
    
    // 获取课程总数
    function getCourseCount() public view returns (uint256) {
        return courseCounter;
    }
}