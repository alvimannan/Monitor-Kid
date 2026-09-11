import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Search, 
  MessageCircle, 
  Filter, 
  Smartphone, 
  Send, 
  CheckCheck,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { ChildDevice, NotificationItem } from '../../types';

interface ParentNotificationsProps {
  device: ChildDevice;
  onSendSimulatedNotification: (notif: Partial<NotificationItem>) => void;
}

export const ParentNotifications: React.FC<ParentNotificationsProps> = ({
  device,
  onSendSimulatedNotification
}) => {
  const [filter, setFilter] = useState<'all' | 'flagged' | 'message' | 'social'>('all');
  const [search, setSearch] = useState('');
  const [showSimulateModal, setShowSimulateModal] = useState(false);

  // Simulation form states
  const [simApp, setSimApp] = useState('WhatsApp');
  const [simSender, setSimSender] = useState('Unknown Contact');
  const [simMessage, setSimMessage] = useState('Hey, lets meet at the secret spot after 9 PM.');

  const filteredNotifs = device.notifications.filter(n => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'flagged' ? n.isFlagged :
      filter === 'message' ? n.category === 'message' :
      n.category === 'social';

    const matchesSearch = 
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.appName.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleSimulate = () => {
    onSendSimulatedNotification({
      appName: simApp,
      packageName: simApp === 'WhatsApp' ? 'com.whatsapp' : simApp === 'Instagram' ? 'com.instagram.android' : 'com.discord',
      title: simSender,
      content: simMessage,
      category: 'message'
    });
    setShowSimulateModal(false);
  };

  const formatTimestamp = (ts: number) => {
    const diffMins = Math.floor((Date.now() - ts) / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            Mirrored Notifications Feed
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Captured continuously in the background via Android <strong>NotificationListenerService</strong>
          </p>
        </div>

        <button
          id="btn-simulate-incoming-notif"
          onClick={() => setShowSimulateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow"
        >
          <Send className="w-4 h-4" />
          Test Incoming Notification
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Alerts ({device.notifications.length})
          </button>
          <button
            onClick={() => setFilter('flagged')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              filter === 'flagged' ? 'bg-red-600 text-white' : 'bg-slate-800 text-red-400 hover:text-red-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Sensitive Keywords ({device.notifications.filter(n => n.isFlagged).length})
          </button>
          <button
            onClick={() => setFilter('message')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'message' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Chats & DMs
          </button>
          <button
            onClick={() => setFilter('social')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'social' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Social Apps
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search notification text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
            No notifications found matching your search.
          </div>
        ) : (
          filteredNotifs.map(notif => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all ${
                notif.isFlagged
                  ? 'bg-red-950/30 border-red-500/40 shadow-lg shadow-red-950/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                    notif.isFlagged ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    {notif.appName.charAt(0)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{notif.appName}</span>
                      <span className="text-slate-500 text-xs">•</span>
                      <span className="text-xs font-semibold text-white">{notif.title}</span>

                      {notif.isFlagged && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          <ShieldAlert className="w-3 h-3" />
                          Risk Flagged
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">{notif.content}</p>

                    {notif.isFlagged && notif.flagReason && (
                      <p className="text-xs text-red-400 font-medium pt-1">
                        ⚠️ Reason: {notif.flagReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(notif.timestamp)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    {notif.packageName}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Simulate Notification Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold">Simulate Incoming Push Notification</h3>
            <p className="text-xs text-slate-400">
              Test real-time capture from child device to parent dashboard.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Source App</label>
                <select
                  value={simApp}
                  onChange={(e) => setSimApp(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Discord">Discord</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Snapchat">Snapchat</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Sender / Title</label>
                <input
                  type="text"
                  value={simSender}
                  onChange={(e) => setSimSender(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Message Content</label>
                <textarea
                  rows={3}
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
                <p className="text-[10px] text-amber-400 mt-1">
                  Tip: Words like "secret", "party", "drugs", "meet alone" will automatically trigger risk alerts.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulate}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
              >
                Trigger Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
