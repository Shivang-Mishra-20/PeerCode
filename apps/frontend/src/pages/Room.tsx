import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SupportedLanguage } from '@peercode/shared';
import AppLayout from '../components/layout/AppLayout';
import CodeEditor from '../components/Editor/CodeEditor';

const INITIAL_CODE: Record<SupportedLanguage, string> = {
  javascript: `// PeerCode Collaborative Editor (JavaScript)
function calculateFibonacci(n) {
  if (n <= 1) return n;
  return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}

console.log("Fibonacci(10):", calculateFibonacci(10));
`,
  typescript: `// PeerCode Collaborative Editor (TypeScript)
interface UserSession {
  id: string;
  name: string;
  role: 'editor' | 'viewer';
}

const activeUser: UserSession = {
  id: "usr_102",
  name: "Alex",
  role: "editor"
};

console.log("Active Session:", activeUser);
`,
  python: `# PeerCode Collaborative Editor (Python)
def prime_factors(n):
    i = 2
    factors = []
    while i * i <= n:
        if n % i:
            i += 1
        else:
            n //= i
            factors.append(i)
    if n > 1:
        factors.append(n)
    return factors

print("Prime Factors of 84:", prime_factors(84))
`,
  cpp: `// PeerCode Collaborative Editor (C++)
#include <iostream>
#include <vector>

int main() {
    std::vector<int> numbers = {10, 20, 30, 40, 50};
    std::cout << "Vector Size: " << numbers.size() << std::endl;
    return 0;
}
`,
};

export const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [code, setCode] = useState<string>(INITIAL_CODE['javascript']);
  const [cursorPos, setCursorPos] = useState<{ line: number; column: number }>({
    line: 1,
    column: 1,
  });

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setCode(INITIAL_CODE[newLang]);
  };

  return (
    <AppLayout
      activeRoomId={roomId}
      activeLanguage={language}
      onLanguageChange={handleLanguageChange}
      cursorPosition={cursorPos}
      showAiPanelDefault={true}
    >
      <div className="flex-1 h-full w-full relative">
        <CodeEditor
          language={language}
          value={code}
          onChange={(val) => setCode(val || '')}
          onCursorChange={(line, column) => setCursorPos({ line, column })}
        />
      </div>
    </AppLayout>
  );
};

export default Room;
