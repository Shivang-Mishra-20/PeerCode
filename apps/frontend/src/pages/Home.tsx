import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Code2, Plus, ArrowRight, Sparkles, Shield, Cpu } from 'lucide-react';

export const Home: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleLaunchRoom = () => {
    const roomId = 'session-demo';
    navigate(`/room/${roomId}`);
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-6">
          {/* Main Desktop Dashboard Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#30363d]">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Developer Workspace
                <Badge variant="accent" size="sm">
                  Local Dev
                </Badge>
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Real-time collaborative code editor with local Ollama AI peer review.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsModalOpen(true)}
            >
              New Room
            </Button>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card hoverable className="cursor-pointer" onClick={() => setIsModalOpen(true)}>
              <CardHeader className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-white">Create Room</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardBody className="py-3">
                <p className="text-xs text-gray-400">
                  Instantiate a new Yjs CRDT room session for collaborative editing.
                </p>
              </CardBody>
            </Card>

            <Card hoverable className="cursor-pointer" onClick={() => handleLaunchRoom()}>
              <CardHeader className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-white">Open Workspace</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardBody className="py-3">
                <p className="text-xs text-gray-400">
                  Open the interactive Monaco Code Editor workspace directly.
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Architecture Highlights */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-xl flex items-center space-x-3">
              <Cpu className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-200">Local AI Engine</p>
                <p className="text-[11px] text-gray-500">Qwen2.5-Coder on Ollama</p>
              </div>
            </div>

            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-xl flex items-center space-x-3">
              <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-200">100% Private</p>
                <p className="text-[11px] text-gray-500">Zero Code Telemetry</p>
              </div>
            </div>

            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-xl flex items-center space-x-3">
              <Code2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-200">4 Languages</p>
                <p className="text-[11px] text-gray-500">JS, TS, Python, C++</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Launcher Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Collaboration Room"
        subtitle="Start a live Yjs CRDT code review session."
      >
        <div className="space-y-4">
          <Input
            label="Display Name"
            placeholder="e.g. Alex"
            value={name}
            onChange={(e) => setName(e.target.value)}
            helperText="Identifies your live cursor in the workspace."
          />
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleLaunchRoom}>
              Launch Room
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
};

export default Home;
