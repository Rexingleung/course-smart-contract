const express = require('express');
const cors = require('cors');
const { CourseContractService } = require('./courseService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 初始化合约服务
let courseService;
try {
    const deployment = JSON.parse(require('fs').readFileSync('deployment.json', 'utf8'));
    courseService = new CourseContractService(
        process.env.RPC_URL || 'http://localhost:8545',
        process.env.PRIVATE_KEY,
        deployment.contractAddress
    );
    console.log('✅ 合约服务初始化成功');
    console.log('合约地址:', deployment.contractAddress);
} catch (error) {
    console.error('❌ 合约服务初始化失败:', error.message);
    process.exit(1);
}

// 错误处理中间件
const handleAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// API路由

// 1. 获取课程总数
app.get('/api/courses/count', handleAsync(async (req, res) => {
    const result = await courseService.getCourseCount();
    
    if (result.success) {
        res.json({
            success: true,
            count: parseInt(result.count)
        });
    } else {
        res.status(500).json({
            success: false,
            error: result.error
        });
    }
}));

// 2. 创建课程
app.post('/api/courses', handleAsync(async (req, res) => {
    const { title, description, price } = req.body;
    
    if (!title || !description || price === undefined) {
        return res.status(400).json({
            success: false,
            error: '标题、描述和价格都是必需的'
        });
    }
    
    if (price < 0) {
        return res.status(400).json({
            success: false,
            error: '价格不能为负数'
        });
    }
    
    const result = await courseService.createCourse(title, description, parseFloat(price));
    
    if (result.success) {
        res.status(201).json({
            success: true,
            courseId: result.courseId,
            txHash: result.txHash,
            gasUsed: result.gasUsed
        });
    } else {
        res.status(500).json({
            success: false,
            error: result.error
        });
    }
}));

// 3. 获取课程信息
app.get('/api/courses/:courseId', handleAsync(async (req, res) => {
    const { courseId } = req.params;
    
    if (!courseId || isNaN(courseId)) {
        return res.status(400).json({
            success: false,
            error: '有效的课程ID是必需的'
        });
    }
    
    const result = await courseService.getCourse(parseInt(courseId));
    
    if (result.success) {
        res.json({
            success: true,
            course: result.course
        });
    } else {
        res.status(404).json({
            success: false,
            error: result.error
        });
    }
}));

// 4. 购买课程
app.post('/api/courses/:courseId/purchase', handleAsync(async (req, res) => {
    const { courseId } = req.params;
    const { payment } = req.body;
    
    if (!courseId || isNaN(courseId)) {
        return res.status(400).json({
            success: false,
            error: '有效的课程ID是必需的'
        });
    }
    
    if (!payment || payment <= 0) {
        return res.status(400).json({
            success: false,
            error: '有效的支付金额是必需的'
        });
    }
    
    const result = await courseService.purchaseCourse(parseInt(courseId), parseFloat(payment));
    
    if (result.success) {
        res.json({
            success: true,
            txHash: result.txHash,
            gasUsed: result.gasUsed
        });
    } else {
        res.status(400).json({
            success: false,
            error: result.error
        });
    }
}));

// 5. 获取课程购买者列表
app.get('/api/courses/:courseId/buyers', handleAsync(async (req, res) => {
    const { courseId } = req.params;
    
    if (!courseId || isNaN(courseId)) {
        return res.status(400).json({
            success: false,
            error: '有效的课程ID是必需的'
        });
    }
    
    const result = await courseService.getCourseBuyers(parseInt(courseId));
    
    if (result.success) {
        res.json({
            success: true,
            buyers: result.buyers,
            count: result.buyers.length
        });
    } else {
        res.status(404).json({
            success: false,
            error: result.error
        });
    }
}));

// 6. 获取用户购买的课程列表
app.get('/api/users/:address/courses', handleAsync(async (req, res) => {
    const { address } = req.params;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({
            success: false,
            error: '有效的以太坊地址是必需的'
        });
    }
    
    const result = await courseService.getUserPurchasedCourses(address);
    
    if (result.success) {
        res.json({
            success: true,
            courseIds: result.courseIds.map(id => parseInt(id)),
            count: result.courseIds.length
        });
    } else {
        res.status(500).json({
            success: false,
            error: result.error
        });
    }
}));

// 7. 检查用户是否购买了特定课程
app.get('/api/courses/:courseId/purchased/:address', handleAsync(async (req, res) => {
    const { courseId, address } = req.params;
    
    if (!courseId || isNaN(courseId)) {
        return res.status(400).json({
            success: false,
            error: '有效的课程ID是必需的'
        });
    }
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({
            success: false,
            error: '有效的以太坊地址是必需的'
        });
    }
    
    const result = await courseService.hasUserPurchasedCourse(parseInt(courseId), address);
    
    if (result.success) {
        res.json({
            success: true,
            hasPurchased: result.hasPurchased
        });
    } else {
        res.status(500).json({
            success: false,
            error: result.error
        });
    }
}));

// 8. 获取账户余额
app.get('/api/balance/:address?', handleAsync(async (req, res) => {
    const { address } = req.params;
    
    if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({
            success: false,
            error: '无效的以太坊地址'
        });
    }
    
    const result = await courseService.getBalance(address);
    
    if (result.success) {
        res.json({
            success: true,
            balance: parseFloat(result.balance),
            balanceWei: result.balanceWei,
            address: result.address
        });
    } else {
        res.status(500).json({
            success: false,
            error: result.error
        });
    }
}));

// 9. 获取所有课程列表（分页）
app.get('/api/courses', handleAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
            success: false,
            error: '页码必须大于0，限制必须在1-100之间'
        });
    }
    
    try {
        const countResult = await courseService.getCourseCount();
        if (!countResult.success) {
            throw new Error(countResult.error);
        }
        
        const totalCourses = parseInt(countResult.count);
        const startId = (page - 1) * limit + 1;
        const endId = Math.min(startId + limit - 1, totalCourses);
        
        const courses = [];
        
        if (startId <= totalCourses) {
            const coursePromises = [];
            for (let i = startId; i <= endId; i++) {
                coursePromises.push(courseService.getCourse(i));
            }
            
            const courseResults = await Promise.all(coursePromises);
            
            courseResults.forEach((result, index) => {
                if (result.success) {
                    courses.push({
                        id: startId + index,
                        ...result.course
                    });
                }
            });
        }
        
        res.json({
            success: true,
            courses: courses,
            pagination: {
                currentPage: page,
                limit: limit,
                totalCourses: totalCourses,
                totalPages: Math.ceil(totalCourses / limit),
                hasNextPage: page * limit < totalCourses,
                hasPrevPage: page > 1
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}));

// 10. WebSocket 事件监听 (可选)
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// WebSocket连接处理
io.on('connection', (socket) => {
    console.log('客户端已连接:', socket.id);
    
    socket.on('subscribe-events', () => {
        console.log('客户端订阅事件:', socket.id);
        
        // 监听课程创建事件
        courseService.listenToCourseCreatedEvents((eventData) => {
            socket.emit('course-created', eventData);
        });
        
        // 监听课程购买事件
        courseService.listenToCoursePurchasedEvents((eventData) => {
            socket.emit('course-purchased', eventData);
        });
    });
    
    socket.on('disconnect', () => {
        console.log('客户端已断开连接:', socket.id);
    });
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Course Contract API',
        contractAddress: courseService ? 'Connected' : 'Not Connected'
    });
});

// API文档端点
app.get('/api/docs', (req, res) => {
    const docs = {
        title: 'Course Contract API Documentation',
        version: '1.0.0',
        baseURL: `http://localhost:${PORT}`,
        endpoints: [
            {
                method: 'GET',
                path: '/api/courses/count',
                description: '获取课程总数'
            },
            {
                method: 'POST',
                path: '/api/courses',
                description: '创建新课程',
                body: { title: 'string', description: 'string', price: 'number' }
            },
            {
                method: 'GET',
                path: '/api/courses/:courseId',
                description: '获取课程信息'
            },
            {
                method: 'POST',
                path: '/api/courses/:courseId/purchase',
                description: '购买课程',
                body: { payment: 'number' }
            },
            {
                method: 'GET',
                path: '/api/courses/:courseId/buyers',
                description: '获取课程购买者列表'
            },
            {
                method: 'GET',
                path: '/api/users/:address/courses',
                description: '获取用户购买的课程列表'
            },
            {
                method: 'GET',
                path: '/api/courses/:courseId/purchased/:address',
                description: '检查用户是否购买了特定课程'
            },
            {
                method: 'GET',
                path: '/api/balance/:address?',
                description: '获取账户余额'
            },
            {
                method: 'GET',
                path: '/api/courses?page=1&limit=10',
                description: '获取所有课程列表（分页）'
            }
        ],
        websocket: {
            url: `ws://localhost:${PORT}`,
            events: ['course-created', 'course-purchased'],
            subscribe: 'emit "subscribe-events" to start listening'
        }
    };
    
    res.json(docs);
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('API错误:', error);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: '端点未找到',
        availableEndpoints: '/api/docs'
    });
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`🚀 Course Contract API服务器运行在端口 ${PORT}`);
    console.log(`📚 API文档: http://localhost:${PORT}/api/docs`);
    console.log(`💊 健康检查: http://localhost:${PORT}/health`);
    console.log(`🔗 WebSocket: ws://localhost:${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到SIGTERM，正在关闭服务器...');
    courseService.stopListening();
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

module.exports = app;