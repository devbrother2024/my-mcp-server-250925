import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

// Create server instance
const server = new McpServer({
    name: 'greeting-mcp-server',
    version: '1.0.0',
    capabilities: {
        tools: {},
        resources: {},
        prompt: {}
    }
})

// Add greeting tool
server.tool(
    'greeting',
    'Friendly greeting tool that can greet users in various languages',
    {
        name: z.string().describe('Name of the person to greet'),
        language: z
            .enum(['korean', 'english', 'japanese', 'spanish'])
            .optional()
            .describe('Language for the greeting (default: korean)')
    },
    async ({ name, language = 'korean' }) => {
        const greetings = {
            korean: `안녕하세요, ${name}님! 반갑습니다! 😊`,
            english: `Hello, ${name}! Nice to meet you! 😊`,
            japanese: `こんにちは、${name}さん！お会いできて嬉しいです！😊`,
            spanish: `¡Hola, ${name}! ¡Mucho gusto! 😊`
        }

        return {
            content: [
                {
                    type: 'text',
                    text: greetings[language]
                }
            ]
        }
    }
)

// Add calculator tools
server.tool(
    'add',
    'Addition calculator that adds two numbers',
    {
        a: z.number().describe('First number'),
        b: z.number().describe('Second number')
    },
    async ({ a, b }) => {
        const result = a + b
        return {
            content: [
                {
                    type: 'text',
                    text: `${a} + ${b} = ${result}`
                }
            ]
        }
    }
)

server.tool(
    'subtract',
    'Subtraction calculator that subtracts second number from first number',
    {
        a: z.number().describe('First number (minuend)'),
        b: z.number().describe('Second number (subtrahend)')
    },
    async ({ a, b }) => {
        const result = a - b
        return {
            content: [
                {
                    type: 'text',
                    text: `${a} - ${b} = ${result}`
                }
            ]
        }
    }
)

server.tool(
    'multiply',
    'Multiplication calculator that multiplies two numbers',
    {
        a: z.number().describe('First number'),
        b: z.number().describe('Second number')
    },
    async ({ a, b }) => {
        const result = a * b
        return {
            content: [
                {
                    type: 'text',
                    text: `${a} × ${b} = ${result}`
                }
            ]
        }
    }
)

server.tool(
    'divide',
    'Division calculator that divides first number by second number',
    {
        a: z.number().describe('First number (dividend)'),
        b: z.number().describe('Second number (divisor)')
    },
    async ({ a, b }) => {
        if (b === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: Division by zero is not allowed`
                    }
                ]
            }
        }
        const result = a / b
        return {
            content: [
                {
                    type: 'text',
                    text: `${a} ÷ ${b} = ${result}`
                }
            ]
        }
    }
)

// Add time tool
server.tool(
    'time',
    'Get current time in specified timezone',
    {
        timezone: z
            .string()
            .optional()
            .describe(
                'Timezone (e.g., "Asia/Seoul", "America/New_York", "Europe/London", "UTC"). Defaults to "UTC"'
            )
    },
    async ({ timezone = 'UTC' }) => {
        try {
            const now = new Date()
            const options: Intl.DateTimeFormatOptions = {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                weekday: 'long'
            }

            const formatter = new Intl.DateTimeFormat('ko-KR', options)
            const formattedTime = formatter.format(now)

            return {
                content: [
                    {
                        type: 'text',
                        text: `🕐 ${timezone} 시간: ${formattedTime}`
                    }
                ]
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ 오류: 유효하지 않은 timezone입니다. (${timezone})\n올바른 형식: "Asia/Seoul", "America/New_York", "Europe/London", "UTC" 등`
                    }
                ]
            }
        }
    }
)

// Add code review prompt
server.prompt(
    'code-review',
    'Generate a comprehensive code review prompt for the provided code',
    {
        code: z.string().describe('The code to be reviewed')
    },
    async ({ code }) => {
        const detectedLanguage = detectLanguage(code)

        const reviewPrompt = `# 📋 코드 리뷰 요청

## 💻 코드 정보
- **언어**: ${detectedLanguage}
- **코드 길이**: ${code.split('\n').length}줄

## 📝 리뷰 대상 코드
\`\`\`${detectedLanguage.toLowerCase()}
${code}
\`\`\`

## 📊 리뷰 체크리스트

### 🔍 코드 품질
- [ ] **가독성**: 코드가 이해하기 쉬운가?
- [ ] **일관성**: 코딩 스타일이 일관되는가?
- [ ] **명명 규칙**: 변수/함수명이 명확한가?
- [ ] **주석**: 필요한 곳에 적절한 주석이 있는가?

### ⚡ 성능 & 효율성
- [ ] **알고리즘**: 효율적인 알고리즘을 사용했는가?
- [ ] **메모리 사용**: 불필요한 메모리 사용이 없는가?
- [ ] **최적화**: 성능 개선 여지가 있는가?

### 🛡️ 보안 & 안정성
- [ ] **에러 처리**: 적절한 예외 처리가 되어있는가?
- [ ] **입력 검증**: 사용자 입력에 대한 검증이 있는가?
- [ ] **보안 취약점**: 알려진 보안 이슈가 없는가?

### 🏗️ 구조 & 설계
- [ ] **모듈화**: 적절히 함수/클래스로 분리되었는가?
- [ ] **재사용성**: 코드 재사용성이 고려되었는가?
- [ ] **확장성**: 향후 확장이 용이한 구조인가?
- [ ] **의존성**: 불필요한 의존성이 없는가?

### 🧪 테스트 가능성
- [ ] **단위 테스트**: 단위 테스트 작성이 용이한가?
- [ ] **디버깅**: 디버깅이 용이한 구조인가?

## 💡 리뷰 가이드라인

### ✅ 좋은 점을 찾아주세요
- 잘 작성된 부분들을 구체적으로 언급
- 좋은 패턴이나 관행 사용 사례

### 🔧 개선 제안
- 구체적인 개선 방안 제시
- 코드 예시와 함께 설명
- 우선순위별로 분류 (critical, major, minor)

### 📚 학습 자료 추천
- 관련 베스트 프랙티스 문서
- 유용한 라이브러리나 도구
- 참고할 만한 코딩 가이드

## 📝 리뷰 템플릿

\`\`\`markdown
## 🔍 코드 리뷰 결과

### ✅ 잘된 점
- [구체적인 좋은 점들을 나열]

### 🔧 개선사항

#### 🚨 Critical (필수 수정)
- [보안이나 기능에 영향을 주는 중요한 이슈]

#### ⚠️ Major (권장 수정)
- [성능이나 유지보수성에 영향을 주는 이슈]

#### ℹ️ Minor (참고사항)
- [코드 스타일이나 가독성 개선사항]

### 💡 제안사항
- [추가 기능이나 구조 개선 아이디어]

### 📊 전체 평가
**점수**: ⭐⭐⭐⭐☆ (4/5)
**한줄평**: [간단한 전체 평가]
\`\`\`

---
📅 생성일시: ${new Date().toLocaleString('ko-KR')}

위 프롬프트를 사용해서 제공된 코드에 대한 체계적인 리뷰를 진행해주세요.`

        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: reviewPrompt
                    }
                }
            ]
        }
    }
)

// Helper function to detect programming language
function detectLanguage(code: string): string {
    // Simple language detection based on common patterns
    if (
        code.includes('function ') ||
        code.includes('const ') ||
        code.includes('let ') ||
        code.includes('=>')
    ) {
        if (
            code.includes('interface ') ||
            code.includes(': string') ||
            code.includes(': number')
        ) {
            return 'TypeScript'
        }
        return 'JavaScript'
    }
    if (
        code.includes('def ') ||
        (code.includes('import ') && code.includes('from '))
    ) {
        return 'Python'
    }
    if (
        code.includes('public class ') ||
        code.includes('private ') ||
        code.includes('public static void main')
    ) {
        return 'Java'
    }
    if (code.includes('#include') || code.includes('int main(')) {
        return 'C/C++'
    }
    if (code.includes('func ') || code.includes('package main')) {
        return 'Go'
    }
    if (code.includes('fn ') || code.includes('let mut ')) {
        return 'Rust'
    }
    if (code.includes('<?php')) {
        return 'PHP'
    }
    if (
        code.includes('SELECT ') ||
        code.includes('FROM ') ||
        code.includes('WHERE ')
    ) {
        return 'SQL'
    }

    return 'Unknown'
}

// Add server spec resource
server.resource(
    'server-spec',
    'server://greeting-mcp-server/spec',
    {
        name: 'Server Specification',
        description: 'Server specification and available tools information',
        mimeType: 'text/markdown'
    },
    async () => {
        const serverSpec = `# Greeting MCP Server 스펙

## 📋 서버 정보
- **이름**: greeting-mcp-server
- **버전**: 1.0.0
- **설명**: 다국어 인사, 계산기, 시간 조회 기능을 제공하는 MCP 서버

## 🛠️ 사용 가능한 도구 (Tools)

### 1. greeting
- **설명**: 다국어로 인사 메시지를 생성
- **매개변수**:
  - \`name\` (string): 인사할 사람의 이름
  - \`language\` (optional): 언어 선택 (korean, english, japanese, spanish)
- **기본 언어**: 한국어

### 2. add
- **설명**: 두 숫자의 덧셈 계산
- **매개변수**:
  - \`a\` (number): 첫 번째 숫자
  - \`b\` (number): 두 번째 숫자

### 3. subtract  
- **설명**: 두 숫자의 뺄셈 계산
- **매개변수**:
  - \`a\` (number): 피감수
  - \`b\` (number): 감수

### 4. multiply
- **설명**: 두 숫자의 곱셈 계산
- **매개변수**:
  - \`a\` (number): 첫 번째 숫자
  - \`b\` (number): 두 번째 숫자

### 5. divide
- **설명**: 두 숫자의 나눗셈 계산 (0으로 나누기 방지)
- **매개변수**:
  - \`a\` (number): 피제수
  - \`b\` (number): 제수

### 6. time
- **설명**: 지정된 타임존의 현재 시간 조회
- **매개변수**:
  - \`timezone\` (optional): IANA 타임존 (기본값: UTC)
- **지원 타임존**: Asia/Seoul, America/New_York, Europe/London 등


## 📝 프롬프트 (Prompts)

### 1. code-review
- **설명**: 코드 리뷰를 위한 체계적인 프롬프트 생성
- **매개변수**:
  - \`code\` (required): 리뷰할 코드
- **지원 언어**: JavaScript, TypeScript, Python, Java, C/C++, Go, Rust, PHP, SQL 등 (자동 감지)

## 📚 리소스 (Resources)

### 1. server-spec
- **설명**: 현재 서버의 상세 스펙 정보 (본 문서)
- **형식**: Markdown

## 🚀 사용 방법
1. MCP 클라이언트에서 서버 연결
2. 원하는 도구를 매개변수와 함께 호출
3. 결과를 텍스트 형태로 수신

## 📅 마지막 업데이트
${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString(
            'ko-KR'
        )}
`

        return {
            contents: [
                {
                    text: serverSpec,
                    uri: 'server://greeting-mcp-server/spec',
                    mimeType: 'text/markdown'
                }
            ]
        }
    }
)

// Start the server
async function main() {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error('Greeting MCP Server running on stdio')
}

main().catch(console.error)
