import { CopilotPanel } from '../features/copilot/widgets/CopilotPanel';

export default function AiAssistantPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -m-4 sm:-m-6 lg:-m-8 pb-0">
      <CopilotPanel />
    </div>
  );
}
