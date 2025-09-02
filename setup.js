#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Course智能合约项目快速设置脚本\n');

// 颜色输出
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

function step(num, description) {
    log(`\n📋 步骤 ${num}: ${description}`, 'blue');
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function warning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function error(message) {
    log(`❌ ${message}`, 'red');
}

// 检查Node.js版本
function checkNodeVersion() {
    step(1, '检查Node.js版本');
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 16) {
        success(`Node.js版本: ${nodeVersion} ✓`);
    } else {
        error(`Node.js版本过低: ${nodeVersion}，需要 >= 16.0.0`);
        process.exit(1);
    }
}

// 安装依赖
function installDependencies() {
    step(2, '安装项目依赖');
    try {
        log('正在安装依赖包...');
        execSync('npm install', { stdio: 'pipe' });
        success('依赖包安装完成');
    } catch (error) {
        error('依赖包安装失败: ' + error.message);
        log('请手动运行: npm install');
        process.exit(1);
    }
}

// 创建环境变量文件
function createEnvFile() {
    step(3, '创建环境变量文件');
    
    if (fs.existsSync('.env')) {
        warning('.env文件已存在，跳过创建');
        return;
    }

    const envTemplate = `# Course智能合约项目环境变量配置

# RPC节点URL
# 本地开发 (Ganache/Hardhat)
RPC_URL=http://localhost:8545

# 或者使用测试网 (取消注释并填入你的API密钥)
# RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
# RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# 私钥 (请替换为你的私钥，不要在生产环境中使用)
# ⚠️  警告: 永远不要将包含真实资金的私钥提交到版本控制系统
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000

# 合约地址 (部署后自动填入)
CONTRACT_ADDRESS=

# 网络链ID
CHAIN_ID=1337  # 本地开发
# CHAIN_ID=11155111  # Sepolia测试网

# 服务器端口
PORT=3000

# Gas价格设置 (可选)
GAS_PRICE=20000000000  # 20 gwei
GAS_LIMIT=6721975

# API密钥 (如果使用第三方服务)
INFURA_PROJECT_ID=
ALCHEMY_API_KEY=
`;

    try {
        fs.writeFileSync('.env', envTemplate);
        success('.env文件创建成功');
        warning('请编辑 .env 文件并填入你的私钥和RPC URL');
    } catch (error) {
        error('创建.env文件失败: ' + error.message);
    }
}

// 检查必要文件
function checkRequiredFiles() {
    step(4, '检查项目文件');
    const requiredFiles = [
        'courseService.js',
        'server.js',
        'deploy.js',
        'test.js',
        'package.json',
        'contracts/Course.sol'
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
        error('缺少必要文件: ' + missingFiles.join(', '));
        error('请确保所有项目文件都在当前目录中');
        process.exit(1);
    }
    
    success('所有必要文件检查通过');
}

// 创建启动脚本
function createStartScript() {
    step(5, '创建快速启动脚本');
    
    const startScript = `#!/bin/bash

echo "🚀 启动Course智能合约项目"

# 检查环境变量
if [ ! -f .env ]; then
    echo "❌ .env文件不存在，请先运行 node setup.js"
    exit 1
fi

# 检查是否已部署合约
if ! grep -q "CONTRACT_ADDRESS=" .env || grep -q "CONTRACT_ADDRESS=$" .env; then
    echo "⚠️  合约尚未部署，正在部署..."
    npm run deploy -- --hardhat
    if [ $? -ne 0 ]; then
        echo "❌ 合约部署失败"
        exit 1
    fi
fi

# 运行测试
echo "🧪 运行基础测试..."
npm test
if [ $? -ne 0 ]; then
    echo "⚠️  测试失败，但继续启动服务器"
fi

# 启动服务器
echo "🌐 启动API服务器..."
npm run server
`;

    try {
        fs.writeFileSync('start.sh', startScript);
        // 给脚本添加执行权限
        try {
            execSync('chmod +x start.sh');
        } catch (e) {
            // Windows系统可能不支持chmod
        }
        success('start.sh启动脚本创建成功');
    } catch (error) {
        error('创建启动脚本失败: ' + error.message);
    }
}

// 显示后续步骤
function showNextSteps() {
    log('\n🎉 设置完成！接下来的步骤:', 'green');
    log('\n1. 编辑 .env 文件：');
    log('   - 设置你的私钥 (PRIVATE_KEY)');
    log('   - 设置RPC URL (RPC_URL)');
    log('   - 如果使用测试网，请确保账户有足够的测试ETH');
    
    log('\n2. 启动本地区块链（如果使用本地开发）：');
    log('   npx hardhat node');
    
    log('\n3. 部署智能合约：');
    log('   npm run deploy -- --hardhat');
    
    log('\n4. 运行测试：');
    log('   npm test');
    
    log('\n5. 启动API服务器：');
    log('   npm run server');
    
    log('\n6. 或者使用一键启动脚本（Linux/Mac）：');
    log('   ./start.sh');
    
    log('\n📚 有用的命令：');
    log('   npm run server     - 启动API服务器');
    log('   npm run deploy     - 部署合约');
    log('   npm test          - 运行测试');
    log('   npm run test:performance - 性能测试');
    
    log('\n🌐 服务地址：');
    log('   API服务器: http://localhost:3000');
    log('   API文档:  http://localhost:3000/api/docs');
    log('   健康检查: http://localhost:3000/health');
    log('   前端演示: 打开 frontend.html 文件');
    
    log('\n📖 更多信息请查看 README.md 文件', 'blue');
    log('\n🔗 GitHub仓库: https://github.com/Rexingleung/course-smart-contract', 'blue');
}

// 主函数
async function main() {
    try {
        checkNodeVersion();
        checkRequiredFiles();
        installDependencies();
        createEnvFile();
        createStartScript();
        showNextSteps();
    } catch (error) {
        error('设置过程中出现错误: ' + error.message);
        process.exit(1);
    }
}

// 运行主函数
main();