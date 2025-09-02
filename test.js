const { CourseContractService } = require('./courseService');
require('dotenv').config();

async function runTests() {
    console.log('🧪 开始测试Course合约服务...\n');
    
    // 从环境变量或deployment.json读取配置
    let config;
    try {
        const deployment = JSON.parse(require('fs').readFileSync('deployment.json', 'utf8'));
        config = {
            providerUrl: process.env.RPC_URL || 'http://localhost:8545',
            privateKey: process.env.PRIVATE_KEY,
            contractAddress: deployment.contractAddress
        };
    } catch (error) {
        config = {
            providerUrl: process.env.RPC_URL || 'http://localhost:8545',
            privateKey: process.env.PRIVATE_KEY,
            contractAddress: process.env.CONTRACT_ADDRESS
        };
    }
    
    if (!config.privateKey || !config.contractAddress) {
        console.error('❌ 请设置环境变量 PRIVATE_KEY 和 CONTRACT_ADDRESS');
        process.exit(1);
    }
    
    const courseService = new CourseContractService(
        config.providerUrl,
        config.privateKey,
        config.contractAddress
    );
    
    let testResults = {
        passed: 0,
        failed: 0,
        tests: []
    };
    
    function logTest(testName, result, error = null) {
        const status = result ? '✅' : '❌';
        console.log(`${status} ${testName}`);
        if (error) console.log(`   错误: ${error}`);
        
        testResults.tests.push({ name: testName, result, error });
        if (result) testResults.passed++;
        else testResults.failed++;
    }
    
    try {
        // 测试1: 获取账户余额
        console.log('1. 测试获取账户余额...');
        const balance = await courseService.getBalance();
        logTest('获取账户余额', balance.success, balance.error);
        if (balance.success) {
            console.log(`   账户地址: ${balance.address}`);
            console.log(`   余额: ${balance.balance} ETH\n`);
        }
        
        // 测试2: 获取课程总数
        console.log('2. 测试获取课程总数...');
        const courseCount = await courseService.getCourseCount();
        logTest('获取课程总数', courseCount.success, courseCount.error);
        if (courseCount.success) {
            console.log(`   当前课程总数: ${courseCount.count}\n`);
        }
        
        // 测试3: 创建课程
        console.log('3. 测试创建课程...');
        const testCourse = {
            title: "测试课程 - " + Date.now(),
            description: "这是一个用于测试的课程",
            price: 0.001 // 0.001 ETH
        };
        
        const createResult = await courseService.createCourse(
            testCourse.title,
            testCourse.description,
            testCourse.price
        );
        logTest('创建课程', createResult.success, createResult.error);
        
        let courseId = null;
        if (createResult.success) {
            courseId = createResult.courseId;
            console.log(`   课程ID: ${courseId}`);
            console.log(`   交易哈希: ${createResult.txHash}\n`);
        }
        
        // 测试4: 获取课程信息
        if (courseId) {
            console.log('4. 测试获取课程信息...');
            const courseInfo = await courseService.getCourse(courseId);
            logTest('获取课程信息', courseInfo.success, courseInfo.error);
            if (courseInfo.success) {
                console.log(`   标题: ${courseInfo.course.title}`);
                console.log(`   描述: ${courseInfo.course.description}`);
                console.log(`   作者: ${courseInfo.course.author}`);
                console.log(`   价格: ${courseInfo.course.price} ETH`);
                console.log(`   创建时间: ${courseInfo.course.createdAt}\n`);
            }
        }
        
        // 测试5: 获取课程购买者列表
        if (courseId) {
            console.log('5. 测试获取课程购买者列表...');
            const buyers = await courseService.getCourseBuyers(courseId);
            logTest('获取课程购买者列表', buyers.success, buyers.error);
            if (buyers.success) {
                console.log(`   购买者数量: ${buyers.buyers.length}\n`);
            }
        }
        
        // 测试6: 检查用户购买状态
        if (courseId) {
            console.log('6. 测试检查用户购买状态...');
            const hasPurchased = await courseService.hasUserPurchasedCourse(
                courseId,
                courseService.wallet.address
            );
            logTest('检查用户购买状态', hasPurchased.success, hasPurchased.error);
            if (hasPurchased.success) {
                console.log(`   当前用户是否已购买: ${hasPurchased.hasPurchased}\n`);
            }
        }
        
        // 测试7: 获取用户购买的课程列表
        console.log('7. 测试获取用户购买的课程列表...');
        const userCourses = await courseService.getUserPurchasedCourses(
            courseService.wallet.address
        );
        logTest('获取用户购买的课程列表', userCourses.success, userCourses.error);
        if (userCourses.success) {
            console.log(`   用户购买的课程数量: ${userCourses.courseIds.length}\n`);
        }
        
        // 测试8: 事件监听测试
        console.log('8. 测试事件监听（创建一个新课程来触发事件）...');
        let eventReceived = false;
        
        // 设置事件监听器
        courseService.listenToCourseCreatedEvents((eventData) => {
            console.log('   📡 收到课程创建事件:', eventData);
            eventReceived = true;
        });
        
        // 创建另一个课程来触发事件
        const eventTestCourse = await courseService.createCourse(
            "事件测试课程 - " + Date.now(),
            "用于测试事件监听的课程",
            0.002
        );
        
        // 等待事件
        if (eventTestCourse.success) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // 等待3秒
            logTest('事件监听', eventReceived, eventReceived ? null : '未收到事件');
        } else {
            logTest('事件监听', false, '创建课程失败，无法测试事件');
        }
        
        // 停止监听事件
        courseService.stopListening();
        
        // 测试9: 错误处理测试
        console.log('\n9. 测试错误处理...');
        
        // 尝试获取不存在的课程
        const nonExistentCourse = await courseService.getCourse(99999);
        logTest('获取不存在的课程（应该失败）', !nonExistentCourse.success, 
               nonExistentCourse.success ? '应该失败但成功了' : null);
        
        // 尝试用余额不足购买课程（如果有课程的话）
        if (courseId) {
            const insufficientPurchase = await courseService.purchaseCourse(courseId, 0.000001); // 极小金额
            logTest('余额不足购买（应该失败）', !insufficientPurchase.success,
                   insufficientPurchase.success ? '应该失败但成功了' : null);
        }
        
        console.log('\n📊 测试结果汇总:');
        console.log(`✅ 通过: ${testResults.passed}`);
        console.log(`❌ 失败: ${testResults.failed}`);
        console.log(`📈 成功率: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
        
        if (testResults.failed > 0) {
            console.log('\n❌ 失败的测试:');
            testResults.tests.filter(t => !t.result).forEach(t => {
                console.log(`   - ${t.name}: ${t.error || '未知错误'}`);
            });
        }
        
        console.log('\n🎉 测试完成!');
        
    } catch (error) {
        console.error('❌ 测试过程中出现意外错误:', error);
        logTest('整体测试', false, error.message);
    }
}

// 性能测试函数
async function performanceTest() {
    console.log('\n⚡ 开始性能测试...');
    
    let config;
    try {
        const deployment = JSON.parse(require('fs').readFileSync('deployment.json', 'utf8'));
        config = {
            providerUrl: process.env.RPC_URL || 'http://localhost:8545',
            privateKey: process.env.PRIVATE_KEY,
            contractAddress: deployment.contractAddress
        };
    } catch (error) {
        config = {
            providerUrl: process.env.RPC_URL || 'http://localhost:8545',
            privateKey: process.env.PRIVATE_KEY,
            contractAddress: process.env.CONTRACT_ADDRESS
        };
    }
    
    const courseService = new CourseContractService(
        config.providerUrl,
        config.privateKey,
        config.contractAddress
    );
    
    // 测试读取操作性能
    console.log('测试读取操作性能...');
    const readStartTime = Date.now();
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
        promises.push(courseService.getCourseCount());
    }
    
    await Promise.all(promises);
    const readEndTime = Date.now();
    console.log(`10次并发读取耗时: ${readEndTime - readStartTime}ms`);
    console.log(`平均每次读取: ${(readEndTime - readStartTime) / 10}ms`);
    
    // 测试创建课程的批量操作
    console.log('\n测试批量创建课程...');
    const createStartTime = Date.now();
    
    const createPromises = [];
    for (let i = 0; i < 3; i++) { // 减少数量以避免nonce问题
        createPromises.push(
            courseService.createCourse(
                `性能测试课程 ${i + 1}`,
                `性能测试描述 ${i + 1}`,
                0.001
            )
        );
        // 添加小延迟避免nonce冲突
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const createResults = await Promise.all(createPromises);
    const createEndTime = Date.now();
    
    const successfulCreations = createResults.filter(r => r.success).length;
    console.log(`3次课程创建耗时: ${createEndTime - createStartTime}ms`);
    console.log(`成功创建: ${successfulCreations}/3`);
    console.log(`平均每次创建: ${(createEndTime - createStartTime) / 3}ms`);
    
    console.log('\n⚡ 性能测试完成!');
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--performance')) {
        await performanceTest();
    } else {
        await runTests();
        
        if (args.includes('--include-performance')) {
            await performanceTest();
        }
    }
}

// 如果直接运行此文件
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    runTests,
    performanceTest
};