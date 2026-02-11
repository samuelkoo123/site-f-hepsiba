
import React, { useState, useEffect } from 'react';
import { Inquiry, Resource, GuestbookEntry, Testimony, Sponsorship } from '../types';
import { LayoutDashboard, MessageSquare, Heart, BookOpen, Trash2, Quote, Loader2, RefreshCcw, ExternalLink, Phone, Handshake } from 'lucide-react';
import { db } from '../db';

const Admin: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'inquiries' | 'sponsorships' | 'guestbook' | 'testimonies'>('inquiries');
  
  const [data, setData] = useState({
    inquiries: [] as Inquiry[],
    sponsorships: [] as Sponsorship[],
    guestbook: [] as GuestbookEntry[],
    testimonies: [] as Testimony[]
  });

  const loadAllData = async () => {
    setLoading(true);
    const allData = await db.getAll();
    setData({
        inquiries: allData.inquiries || [],
        sponsorships: allData.sponsorships || [],
        guestbook: allData.guestbook || [],
        testimonies: allData.testimonies || []
    });
    setLoading(false);
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadAllData();
    }
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'hephzibah777') {
      setIsLoggedIn(true);
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('정말 이 항목을 삭제하시겠습니까? 구글 스프레드시트에서도 삭제 요청이 전송됩니다.')) return;
    
    setLoading(true);
    const success = await db.delete(type, id);
    if (success) {
      alert('삭제 요청이 완료되었습니다.');
      setTimeout(loadAllData, 1000);
    } else {
      alert('삭제 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-orange-100 w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <LayoutDashboard className="w-10 h-10 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 serif">관리자 시스템</h1>
            <p className="text-sm text-gray-500 mt-3">Hephzibah Mission Admin Console</p>
          </div>
          <div className="space-y-4">
            <input 
              type="password" 
              placeholder="관리자 비밀번호" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all bg-gray-50 font-medium text-center"
            />
            <button type="submit" className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg">
              로그인
            </button>
          </div>
        </form>
      </div>
    );
  }

  const currentList = data[view];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 animate-in fade-in duration-700">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 serif flex items-center gap-4">
            실시간 관리 센터
            {loading && <Loader2 className="w-8 h-8 animate-spin text-orange-500" />}
          </h1>
          <p className="text-gray-500 mt-2">구글 스프레드시트 데이터와 실시간 연동 중입니다.</p>
        </div>
        
        <div className="flex flex-wrap items-center bg-white p-2 rounded-[1.5rem] shadow-sm border border-orange-50 gap-2">
          <button 
            onClick={loadAllData}
            disabled={loading}
            className="p-3 hover:bg-orange-50 rounded-xl text-orange-500 transition-colors disabled:opacity-50"
            title="새로고침"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="w-px h-6 bg-gray-100 mx-2"></div>
          {[
            { id: 'inquiries', label: '문의', icon: <MessageSquare size={18} />, count: data.inquiries.length },
            { id: 'sponsorships', label: '후원 현황', icon: <Handshake size={18} />, count: data.sponsorships.length },
            { id: 'guestbook', label: '방명록', icon: <BookOpen size={18} />, count: data.guestbook.length },
            { id: 'testimonies', label: '간증', icon: <Quote size={18} />, count: data.testimonies.length },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setView(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${view === tab.id ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`ml-1 px-2 py-0.5 rounded-lg text-[10px] ${view === tab.id ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-orange-50 overflow-hidden">
        {!loading && currentList.length === 0 ? (
          <div className="py-40 text-center">
            <RefreshCcw className="text-gray-200 w-16 h-16 mx-auto mb-4" />
            <p className="text-gray-400 serif text-xl">데이터가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-10 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">날짜</th>
                  <th className="px-10 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">작성자/후원자</th>
                  <th className="px-10 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">상세 내역</th>
                  <th className="px-10 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentList.map((item: any, idx) => (
                  <tr key={item.id || idx} className="hover:bg-orange-50/10 transition-colors group">
                    <td className="px-10 py-8 text-sm text-gray-400 font-medium">{item.date}</td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-1">
                        <p className="font-bold text-gray-800 text-lg">{item.name || item.author}</p>
                        {item.phone && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone size={10} /> {item.phone}
                          </p>
                        )}
                        {item.email && <p className="text-xs text-orange-400">{item.email}</p>}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-2">
                        {view === 'sponsorships' ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${item.type === '정기후원' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                {item.type}
                              </span>
                              <p className="font-bold text-gray-800">
                                {Number(item.amount).toLocaleString()}원
                              </p>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 max-w-md">
                              {item.message || '남긴 메시지가 없습니다.'}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-700">{item.subject || item.title || '메시지'}</p>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 max-w-md">
                              {item.message || item.description || item.content}
                            </p>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <button 
                        onClick={() => handleDelete(item.id, view === 'sponsorships' ? 'sponsorship' : view.slice(0, -1))}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
