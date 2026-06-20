import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/api/messages';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [selectedPeer, setSelectedPeer] = useState<number | null>(null);
  const [text, setText] = useState('');

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesApi.conversations,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!selectedPeer && conversations.length > 0) setSelectedPeer(conversations[0].peer.id);
  }, [conversations, selectedPeer]);

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedPeer],
    queryFn: () => messagesApi.messages(Number(selectedPeer)),
    enabled: Boolean(selectedPeer),
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: () => messagesApi.send(Number(selectedPeer), text),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedPeer] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return (
    <div className="grid h-[70vh] grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
      <aside className="rounded-xl border border-theme-border glass-panel p-2">
        {conversations.map((c) => (
          <button key={c.peer.id} className="w-full rounded-lg p-3 text-left hover:bg-theme-surface" onClick={() => setSelectedPeer(c.peer.id)}>
            <p className="font-medium">{c.peer.name}</p>
            <p className="truncate text-xs text-theme-text-secondary">{c.last_message.content}</p>
          </button>
        ))}
      </aside>

      <section className="flex flex-col rounded-xl border border-theme-border glass-panel">
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${m.sender_id === selectedPeer ? 'bg-theme-surface' : 'ml-auto bg-blue-600 text-white'}`}>
              <p>{m.content}</p>
              <p className="mt-1 text-[10px] opacity-70">{new Date(m.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t p-3">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." />
          <Button onClick={() => sendMutation.mutate()} disabled={!selectedPeer || !text.trim()}>Send</Button>
        </div>
      </section>
    </div>
  );
}
