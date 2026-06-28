import React, { useState, useEffect, useRef } from 'react';
import { XIcon, BackIcon, ArrowUpIcon, ArrowDownIcon } from './icons';

interface EconomyReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const readings = [
  { id: 1, file: "1. 돈의 역사.jpg", title: "돈의 역사", desc: "인류가 처음 사용한 조개껍데기 화폐부터 오늘날의 종이돈과 디지털 화폐까지, 돈이 어떻게 발전해왔는지 알아봐요." },
  { id: 2, file: "2. 소득.jpg", title: "소득이란 무엇일까?", desc: "일을 하거나 투자를 해서 얻는 소득의 종류를 알아보고, 우리가 어떻게 돈을 벌 수 있는지 배워요." },
  { id: 3, file: "3. 예금과 적금.jpg", title: "예금과 적금", desc: "은행에 안전하게 돈을 맡기는 예금과 매달 차곡차곡 모으는 적금의 차이점을 쉽게 이해해봐요." },
  { id: 4, file: "4. 세금.jpg", title: "세금은 왜 낼까?", desc: "나라와 지역사회를 운영하기 위해 국민들이 모으는 세금은 어떤 곳에 유용하게 쓰일까요?" },
  { id: 5, file: "5. 주식(1).jpg", title: "주식의 기초 (1)", desc: "기업의 주인이 되는 조각, '주식'의 기본 개념과 회사가 주식을 발행하는 이유를 알아봐요." },
  { id: 6, file: "6. 주식(2).jpg", title: "주식의 기초 (2)", desc: "주식 가격이 변하는 원리와 주식 투자 시 꼭 지켜야 할 안전한 규칙들을 배워봅니다." },
  { id: 7, file: "7. 펀드.jpg", title: "펀드와 분산투자", desc: "여러 사람의 돈을 모아 전문가가 대신 투자해주는 펀드의 똑똑한 분산투자 원리를 알아봐요." },
  { id: 8, file: "8. 신용등급.jpg", title: "나의 신용등급", desc: "약속을 잘 지키는 신용의 가치와, 개인의 신용등급이 경제생활에서 얼마나 중요한지 배워봐요." },
  { id: 9, file: "9. 부동산(1).jpg", title: "부동산 이야기 (1)", desc: "우리가 사는 집과 토지가 가진 경제적 가치와 부동산 시장의 기초를 탐구해봐요." },
  { id: 10, file: "10. 부동산(2).jpg", title: "부동산 이야기 (2)", desc: "부동산 세금, 국가의 주거정책, 부동산의 가치에 대해 알아보아요." },
  { id: 11, file: "11. 보험(1).jpg", title: "보험이란 무엇일까? (1)", desc: "예상치 못한 사고나 질병이 발생했을 때, 서로서로 돕고 이겨낼 수 있게 해주는 보험의 원리를 알아봐요." },
  { id: 12, file: "12. 보험(2).jpg", title: "보험이란 무엇일까? (2)", desc: "보험이 어떻게 시작되었는지, 다양한 보험의 종류와 보험료 계산의 비밀들을 알아봐요." },
  { id: 13, file: "13. 환율.jpg", title: "환율(1)", desc: "다른 나라의 돈과 우리나라 돈을 바꿀 때 기준이 되는 환율이 무엇인지 쉽고 명쾌하게 배워봐요." },
  { id: 14, file: "14. 환율(2).jpg", title: "환율(2)", desc: "환율이 오르고 내릴 때 우리나라 수출 기업과 해외 여행객들에게 어떤 영향이 미치는지 알아봅니다." },
  { id: 15, file: "15. 기축통화.jpg", title: "세계의 대장 돈, 기축통화", desc: "전 세계 어디에서나 널리 쓰이는 기준 통화인 미국의 달러와 기축통화의 강력한 힘을 배워봐요." },
  { id: 16, file: "16. 돈의 비밀.jpg", title: "돈의 비밀", desc: "화폐 속 과학부터 찢어진 돈의 운명까지! 돈의 일생과 비밀에 대해 알아봅시다." },
  { id: 17, file: "17. 기회비용.jpg", title: "기회비용과 선택", desc: "하나를 선택하면 포기해야 하는 다른 선택지의 가치, 기회비용을 계산해 현명한 결정을 내려봐요." },
  { id: 18, file: "18. 계획 소비.jpg", title: "계획적인 소비 습관", desc: "용돈기입장을 쓰고 예산을 세워 꼭 필요한 곳에 돈을 쓰는 올바른 소비 습관의 첫걸음입니다." },
  { id: 19, file: "19. 소비의 유혹.jpg", title: "소비의 유혹", desc: "마케팅의 과학을 알아보고 합리적인 소비를 해요." },
  { id: 20, file: "20. 가격표의 심리학.jpg", title: "가격표 속 숨겨진 심리학", desc: "마트나 상점에서 소비자가 더 많이 사게 만드는 가격 책정의 흥미로운 비밀을 파헤쳐봅니다." },
  { id: 21, file: "21. 구독경제.jpg", title: "매달 이용하는 구독경제", desc: "매달 일정한 돈을 내고 상품이나 서비스를 편리하게 이용하는 트렌디한 구독 경제를 배워봐요." },
  { id: 22, file: "22. 수요와 공급.jpg", title: "수요와 공급의 법칙", desc: "시장에서 물건을 사려는 수요와 팔려는 공급이 만나 가격이 결정되는 핵심 경제 원리입니다." },
  { id: 23, file: "23. 시장 구조.jpg", title: "시장 경쟁과 구조", desc: "완전경쟁시장부터 독점시장까지, 우리 주변 상점들이 경쟁하는 다양한 시장의 모습을 이해해봐요." },
  { id: 24, file: "24. 인플레이션(1).jpg", title: "인플레이션과 디플레이션 (1)", desc: "시소처럼 움직이는 물가와 돈의 가치! 인플레이션에 대해 알아봅시다." },
  { id: 25, file: "25. 인플레이션(2).jpg", title: "인플레이션과 디플레이션 (2)", desc: "돈의 가치가 변하는 이유와 대처방법에 대해 알아봐요." },
  { id: 26, file: "26. 공유경제.jpg", title: "나눠 쓰는 공유경제", desc: "물건을 혼자 소유하지 않고 여러 사람이 나누어 쓰는 친환경적이고 경제적인 공유 모델을 알아봅니다." },
  { id: 27, file: "27. 노동과 소득.jpg", title: "노동과 정당한 대가", desc: "우리의 노력과 지혜로 노동을 제공하고 그 대가로 정당하게 받는 소득의 소중함을 배워봐요." },
  { id: 28, file: "27. 세금(심화).jpg", title: "세금 심화 탐구", desc: "소득세, 부가가치세 등 복잡하지만 우리 삶과 밀접한 다양한 세금들의 계산법과 역할을 심화 탐구합니다." },
  { id: 29, file: "28. 금융 사기 예방.jpg", title: "소중한 내 돈, 금융 사기 예방", desc: "보이스피싱이나 개인정보 유출 등 무서운 금융 사기로부터 소중한 자산을 안전하게 지키는 요령을 알아봅니다." }
];

export const EconomyReadingModal: React.FC<EconomyReadingModalProps> = ({ isOpen, onClose }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const touchStartX = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // 모달이 열리면 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentReading = readings.find(r => r.id === selectedId) || null;
  const currentIndex = readings.findIndex(r => r.id === selectedId);

  const handleNext = () => {
    if (currentIndex < readings.length - 1) {
      setSelectedId(readings[currentIndex + 1].id);
      setZoomScale(1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedId(readings[currentIndex - 1].id);
      setZoomScale(1);
    }
  };

  // 모바일 터치 스와이프 지원
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;

    // 100px 이상 쓸어넘겼을 때 동작 (단, 줌 상태가 1일 때만 동작하도록 하여 스크롤 방해 차단)
    if (zoomScale === 1) {
      if (diffX > 80) {
        handleNext();
      } else if (diffX < -80) {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-0 md:p-4 animate-fadeIn">
      <div className="bg-[#F2F4F7] w-full h-full md:rounded-[40px] overflow-hidden shadow-2xl flex flex-col relative">
        
        {/* 헤더 */}
        <div className="p-5 md:p-6 bg-white border-b flex justify-between items-center sticky top-0 z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="font-black text-xl text-gray-950 tracking-tight">경제 상식 알기</h3>
              <p className="text-xs text-gray-400 font-bold tracking-tight">쉽고 재미있게 배우는 초등 금융경제 읽기 자료</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-gray-50 hover:bg-gray-100 active:scale-95 text-gray-600 hover:text-gray-900 rounded-full transition-all shadow-sm border border-gray-100"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 메인 리스트 뷰 */}
        {selectedId === null ? (
          <div className="flex-grow overflow-y-auto p-6 md:p-10">
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-indigo-100 flex flex-col md:flex-row items-center gap-6 mb-8 shadow-sm">
              <div className="w-16 h-16 bg-indigo-50 rounded-[22px] flex items-center justify-center shrink-0 shadow-inner">
                <svg className="w-8 h-8 text-indigo-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-black text-gray-950 tracking-tight mb-1">재미있는 어린이 경제 교실 💡</h2>
                <p className="text-sm text-gray-500 font-bold leading-relaxed">
                  다양한 핵심 경제 주제가 알차게 들어있어요! 알고 싶은 카드 주제를 터치하면 <br className="hidden md:block" />
                  전체 화면에서 크고 선명하게 볼 수 있습니다. 손가락으로 가볍게 밀어서 다음 편으로 넘겨보세요!
                </p>
              </div>
            </div>

            {/* 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {readings.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    setZoomScale(1);
                  }}
                  className="group bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:scale-[1.03] transition-all flex flex-col text-left active:scale-98"
                >
                  <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden shrink-0 border-b border-gray-50">
                    <img 
                      src={`/economy_reading/${item.file}`} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-black/60 text-white font-mono text-xs font-black px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
                      No.{item.id}
                    </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="font-black text-lg text-gray-950 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-400 font-bold leading-relaxed line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end items-center text-xs font-black text-indigo-500 group-hover:text-indigo-700 transition-colors gap-1">
                      <span>크게 읽기</span>
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          
          /* 확대 팝업 뷰 */
          <div className="flex-grow flex flex-col bg-gray-900 overflow-hidden relative">
            
            {/* 확대 컨트롤바 */}
            <div className="bg-black/80 px-4 py-3 flex flex-wrap gap-3 items-center justify-between z-20 border-b border-gray-800 shrink-0">
              <button 
                onClick={() => setSelectedId(null)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl text-sm font-black transition-all active:scale-95"
              >
                <BackIcon className="w-5 h-5" />
                <span>목록으로</span>
              </button>

              <div className="text-white text-center flex-1 min-w-[120px]">
                <h4 className="font-black text-base line-clamp-1 text-indigo-300">{currentReading.title}</h4>
                <p className="text-xs font-bold text-gray-400">No.{currentReading.id} / {readings.length}</p>
              </div>

              {/* 확대/축소 및 슬라이더 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomScale(prev => Math.max(1, prev - 0.25))}
                  disabled={zoomScale <= 1}
                  className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-xl font-bold transition-all"
                  title="축소"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </button>
                <span className="text-white text-xs font-mono font-black w-12 text-center bg-gray-950 px-2.5 py-1.5 rounded-lg border border-gray-800">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={() => setZoomScale(prev => Math.min(3, prev + 0.25))}
                  disabled={zoomScale >= 3}
                  className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-xl font-bold transition-all"
                  title="확대"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </button>
                <button
                  onClick={() => setZoomScale(1)}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-black transition-all"
                >
                  기본 크기
                </button>
              </div>
            </div>

            {/* 이미지 뷰 영역 */}
            <div 
              ref={scrollContainerRef}
              className="flex-grow overflow-auto flex items-start justify-center p-4 md:p-8 touch-pan-y relative"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* 실제 이미지 */}
              <div 
                className="transition-all duration-200 ease-out select-none"
                style={{ 
                  width: zoomScale === 1 ? '100%' : `${zoomScale * 100}%`, 
                  maxWidth: zoomScale === 1 ? '700px' : 'none',
                  transform: 'translateZ(0)' // GPU 가속 유도
                }}
              >
                <img 
                  src={`/economy_reading/${currentReading.file}`} 
                  alt={currentReading.title}
                  className="w-full h-auto object-contain shadow-2xl rounded-2xl mx-auto"
                  style={{ pointerEvents: zoomScale > 1 ? 'auto' : 'none' }}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* 하단 모바일 안내 말풍선 (줌 배율이 1일 때만 띄움) */}
              {zoomScale === 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2.5 rounded-full text-[11px] md:text-xs font-bold text-gray-200 pointer-events-none flex items-center gap-2 border border-gray-800 shadow-xl backdrop-blur-sm animate-pulse">
                  <span>👈 좌우 스와이프나 화살표로 넘겨보세요</span>
                  <span className="text-gray-400">|</span>
                  <span>상단 우측 돋보기로 확대 가능</span>
                </div>
              )}
            </div>

            {/* 이전 / 다음 탐색 패널 */}
            <div className="absolute inset-y-1/2 left-4 right-4 flex justify-between items-center pointer-events-none z-10">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="w-14 h-14 bg-black/60 hover:bg-black/90 disabled:opacity-0 hover:scale-105 active:scale-95 text-white rounded-full flex items-center justify-center transition-all border border-white/10 pointer-events-auto disabled:pointer-events-none shadow-2xl"
                title="이전 페이지"
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === readings.length - 1}
                className="w-14 h-14 bg-black/60 hover:bg-black/90 disabled:opacity-0 hover:scale-105 active:scale-95 text-white rounded-full flex items-center justify-center transition-all border border-white/10 pointer-events-auto disabled:pointer-events-none shadow-2xl"
                title="다음 페이지"
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 상세 설명 하단바 */}
            <div className="bg-black/90 p-4 border-t border-gray-800 text-center shrink-0">
              <p className="text-sm font-bold text-gray-300 max-w-2xl mx-auto leading-relaxed">
                {currentReading.desc}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
