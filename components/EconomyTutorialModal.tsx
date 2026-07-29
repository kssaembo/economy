import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XIcon } from './icons';
import html2canvas from 'html2canvas';

interface EconomyTutorialLauncherProps {
  userId: string;
  userName: string;
  isMobile?: boolean;
}

export const EconomyTutorialLauncher: React.FC<EconomyTutorialLauncherProps> = ({ userId, userName, isMobile = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Check completion status from LocalStorage
  const checkCompletion = () => {
    try {
      const completed = localStorage.getItem(`classbank_tutorial_completed_v2_${userId}`);
      setIsCompleted(completed === 'true');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkCompletion();
    const handleStorageChange = () => checkCompletion();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tutorialUpdate', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tutorialUpdate', handleStorageChange);
    };
  }, [userId]);

  if (isMobile) {
    return (
      <>
        <button
          id="tutorial-mobile-btn"
          onClick={() => setIsOpen(true)}
          className={`w-7 h-7 rounded-xl shadow-sm border transition-all active:scale-90 flex items-center justify-center text-xs shrink-0 ${
            isCompleted 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' 
              : 'bg-indigo-50 text-indigo-700 border-indigo-200 font-black'
          }`}
          title="금융 가이드"
        >
          <span>{isCompleted ? '🎓' : '🔖'}</span>
        </button>
        <EconomyTutorialModal isOpen={isOpen} onClose={() => setIsOpen(false)} userId={userId} userName={userName} onComplete={checkCompletion} />
      </>
    );
  }

  return (
    <>
      <button
        id="tutorial-desktop-btn"
        onClick={() => setIsOpen(true)}
        className={`group relative flex flex-col items-center justify-center pt-4 pb-3.5 px-4 rounded-b-2xl shadow-sm border-x border-b transition-all duration-200 cursor-pointer ${
          isCompleted
            ? 'bg-emerald-50/90 hover:bg-emerald-100/90 backdrop-blur-md text-emerald-700 border-emerald-200 shadow-emerald-50/30'
            : 'bg-indigo-50/90 hover:bg-indigo-100/90 backdrop-blur-md text-indigo-700 border-indigo-200 shadow-indigo-50/30'
        }`}
        style={{ width: '84px' }}
      >
        <span className="text-xl transition-transform group-hover:scale-110">
          {isCompleted ? '🎓' : '🔖'}
        </span>
        <span className="text-[11px] font-black tracking-tight mt-1">
          {isCompleted ? '이수증' : '가이드'}
        </span>
        <div className={`absolute top-0 left-0 right-0 h-[3px] ${isCompleted ? 'bg-emerald-400' : 'bg-[#7c8df4]'}`} />
      </button>
      <EconomyTutorialModal isOpen={isOpen} onClose={() => setIsOpen(false)} userId={userId} userName={userName} onComplete={checkCompletion} />
    </>
  );
};

interface EconomyTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onComplete: () => void;
}

// Coordinate interface
interface Point {
  x: number;
  y: number;
}

// Stage config
interface ConceptConfig {
  title: string;
  text: string;
}

interface QuizConfig {
  question: string;
  choices: string[];
  correctIndex: number;
  explain: string;
}

interface StageConfig {
  stageNum: number;
  title: string;
  item: string;
  itemEmoji: string;
  monsterName: string;
  monsterEmoji: string;
  obstacles: Point[];
  puddles: Point[];
  playerStart: Point;
  chestPos: Point;
  concepts: ConceptConfig[];
  quizzes: QuizConfig[];
}

const STAGES: StageConfig[] = [
  {
    stageNum: 1,
    title: "나의 자산 알아보기",
    item: "황금 열쇠",
    itemEmoji: "🔑",
    monsterName: "자산 꼬마 고블린",
    monsterEmoji: "👾",
    playerStart: { x: 0, y: 5 },
    chestPos: { x: 11, y: 0 },
    obstacles: [
      { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 },
      { x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 },
      { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 },
      { x: 10, y: 1 }
    ],
    puddles: [
      { x: 1, y: 3 }, { x: 4, y: 4 }, { x: 7, y: 1 }, { x: 10, y: 3 }
    ],
    concepts: [
      {
        title: "내 돈의 진짜 크기, '총 자산'",
        text: "내 총 자산은 눈앞에 보이는 현금 뿐만 아니라, 통장에 든 계좌 잔액과 저축해 둔 예적금을 모두 합친 금액이에요. 클래스뱅크 홈화면에서 '내 총 자산'을 확인해 보아요!"
      },
      {
        title: "계좌 번호의 비밀",
        text: "계좌번호는 돈을 정확하고 안전하게 보내고 받기 위해 필요한 나만의 고유 식별 주소입니다. 친구에게 무거운 현금을 들고 갈 필요 없이 계좌번호 하나면 마음을 전할 수 있어요."
      },
      {
        title: "거래 내역 확인의 중요성",
        text: "돈의 흐름을 주기적으로 조회하면 불필요한 과소비를 막고 소중한 용돈을 계획적으로 모을 수 있습니다. 입금과 출금이 기록된 장부를 수시로 확인하는 습관을 가져요!"
      }
    ],
    quizzes: [
      {
        question: "내 통장에 있는 돈과 현금, 예적금을 다 더한 것을 뭐라고 부를까요?",
        choices: ["① 내 총 자산", "② 친구의 용돈"],
        correctIndex: 0,
        explain: "정답이에요! 내가 가진 모든 예금과 현금을 다 합친 것이 '내 총 자산'이에요."
      },
      {
        question: "내 계좌로 친구가 돈을 보낼 수 있게 해주는 고유한 식별 주소는 무엇일까요?",
        choices: ["① 계좌 번호", "② 내 가방 번호"],
        correctIndex: 0,
        explain: "정답이에요! 계좌번호가 있어야 정확한 위치로 안전하게 돈이 전송될 수 있답니다."
      },
      {
        question: "내 돈의 입금과 출금 흐름을 정확하게 파악하기 위해 수시로 확인해야 하는 것은?",
        choices: ["① 거래 내역 조회", "② 만화책 일기장"],
        correctIndex: 0,
        explain: "정답이에요! 거래 내역 조회를 통해 나의 지출과 수입을 똑똑하게 관리할 수 있어요."
      }
    ]
  },
  {
    stageNum: 2,
    title: "안전하고 신속한 송금",
    item: "신뢰의 우편 배지",
    itemEmoji: "✉️",
    monsterName: "송금 방해 유령",
    monsterEmoji: "👻",
    playerStart: { x: 0, y: 0 },
    chestPos: { x: 11, y: 5 },
    obstacles: [
      { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 },
      { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }, { x: 4, y: 5 },
      { x: 7, y: 0 }, { x: 7, y: 1 }, { x: 7, y: 2 },
      { x: 10, y: 3 }, { x: 10, y: 4 }
    ],
    puddles: [
      { x: 2, y: 4 }, { x: 5, y: 1 }, { x: 8, y: 5 }, { x: 9, y: 1 }
    ],
    concepts: [
      {
        title: "가게에서 전자 화폐로 결제해요.",
        text: "인터넷과 스마트폰이 발달하면서 이제 가게에서 결제할 때 현금 뿐만 아니라 다양한 형태의 전자 화폐를 사용해요. QR결제, 바코드 결제, 삼성, 애플페이와 같은 NFC 결제 등 다양한 결제 방식이 있어요."
      },
      {
        title: "계좌번호로 돈을 보내는 송금",
        text: "친구에게 돈을 보낼 때는 무거운 실물 화폐를 들고 다닐 필요 없이, 친구의 고유 계좌번호와 이름만 입력하면 안전하고 신속하게 돈이 전송돼요!"
      }
    ],
    quizzes: [
      {
        question: "현금 대신 스마트폰이나 카드를 이용해 QR, 바코드, NFC 등으로 결제하는 방식을 무엇이라고 할까요?",
        choices: ["① 전자 화폐 결제", "② 실물 조개껍데기 결제"],
        correctIndex: 0,
        explain: "정답이에요! QR코드, 애플페이, 삼성페이 등은 현대 사회에서 널리 쓰이는 전자 화폐 결제 방식이랍니다."
      },
      {
        question: "친구에게 용돈을 안전하게 보내기 위해 꼭 필요한 정보는 무엇일까요?",
        choices: ["① 친구의 고유 계좌번호와 이름", "② 친구가 좋아하는 음식"],
        correctIndex: 0,
        explain: "정답이에요! 친구의 고유 계좌번호와 이름을 알아야 정확히 안전 전송된답니다."
      }
    ]
  },
  {
    stageNum: 3,
    title: "성장과 규칙의 주식 투자",
    item: "행운의 돋보기",
    itemEmoji: "📈",
    monsterName: "욕심쟁이 투기 여우",
    monsterEmoji: "🦊",
    playerStart: { x: 0, y: 3 },
    chestPos: { x: 11, y: 3 },
    obstacles: [
      { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 },
      { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 },
      { x: 8, y: 0 }, { x: 8, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }
    ],
    puddles: [
      { x: 1, y: 4 }, { x: 4, y: 1 }, { x: 7, y: 4 }, { x: 10, y: 1 }
    ],
    concepts: [
      {
        title: "주식 투자와 기업의 성장",
        text: "주식은 회사의 주인이 되어 성장에 동참하고, 회사가 번 이익의 일부를 배당금 등으로 돌려받는 건전한 자산 운용 방법이에요! 주가가 오르면 이득이지만, 내리면 손해를 봐요."
      },
      {
        title: "주식은 수요와 공급에 따라 가격이 변해요.",
        text: "주식은 회사의 주인임을 증명하는 일종의 '증서'로, 이 증서를 사면 회사의 주주가 됩니다. 주식의 가격은 시장에서 이를 사려는 사람(수요)이 많으면 오르고, 팔려는 사람(공급)이 많으면 내려갑니다."
      },
      {
        title: "클래스뱅크만의 규칙",
        text: "주식은 기업의 가치에 투자하는 것으로 게임이나 도박이 아닙니다. 따라서 클래스뱅크에서는 지혜로운 주식 투자를 위해 하루 매매/매수 한도 제한, 10분 락 타임 등의 기능을 제공합니다."
      }
    ],
    quizzes: [
      {
        question: "기업의 주인이 되어 기업의 성장을 함께 도모하고 가치를 나누는 건강한 자산 운용법은?",
        choices: ["① 주식 투자", "② 복권 구매"],
        correctIndex: 0,
        explain: "정답이에요! 주식 투자는 유망한 기업의 성장에 동참해 과실을 나누는 상생 행동이에요."
      },
      {
        question: "주식 시장에서 주식의 가격을 결정하는 가장 핵심적인 원리는 무엇일까요?",
        choices: ["① 수요와 공급", "② 가위바위보"],
        correctIndex: 0,
        explain: "정답이에요! 사려는 사람(수요)이 많으면 주가가 오르고, 팔려는 사람(공급)이 많으면 주가가 내려갑니다."
      },
      {
        question: "클래스뱅크에서 지혜롭고 신중한 주식 투자를 위해 제공하는 안전장치(하루 매매 한도 제한, 10분 락 타임 등)가 있는 이유는 무엇일까요?",
        choices: ["① 지혜롭고 계획적인 주식 투자를 돕기 위해", "② 무조건 주식 거래를 방해하기 위해"],
        correctIndex: 0,
        explain: "정답이에요! 주식은 기업의 가치에 투자하는 건전한 수단이므로 무리한 투기를 막기 위한 안전장치가 존재합니다."
      }
    ]
  },
  {
    stageNum: 4,
    title: "함께해서 든든한 공동체 펀드",
    item: "협동의 방패",
    itemEmoji: "🛡️",
    monsterName: "나태의 지각 멧돼지",
    monsterEmoji: "🐗",
    playerStart: { x: 11, y: 5 },
    chestPos: { x: 0, y: 0 },
    obstacles: [
      { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 },
      { x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 },
      { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 }
    ],
    puddles: [
      { x: 1, y: 1 }, { x: 4, y: 4 }, { x: 7, y: 1 }, { x: 10, y: 2 }
    ],
    concepts: [
      {
        title: "친구들과 힘을 모으는 '펀드'",
        text: "혼자 투자하기 겁날 땐 친구들과 힘을 모으는 펀드가 있어요! 여러 명의 소액 자산을 한데 모아 규모 있는 안전 자금으로 굴려 공동의 이익을 도출하는 든든한 상생 기법입니다."
      },
      {
        title: "분산 투자와 위험의 감소",
        text: "한 바구니에 모든 달걀을 담으면 깨지기 쉽듯이, 성격이 다른 여러 공동체 미션 펀드에 나의 투자금을 분산해 배치하면 위험은 획기적으로 줄고 자산은 고르게 성장합니다."
      },
      {
        title: "우리 반 약속을 펀드로",
        text: "우리 반에서 함께 실천할 수 있는 약속을 펀드로 만들어요. 그리고 펀드에 가입해 함께 실천하고 약속을 모두 지키면 그에 따른 보상을 받을 수 있어요."
      }
    ],
    quizzes: [
      {
        question: "여러 친구들이 소액 자금을 모으고 협력해 학급 공동 미션을 달성하고 이익을 나누는 투자법은?",
        choices: ["① 도박", "② 펀드"],
        correctIndex: 1,
        explain: "정답이에요! 학급의 지각 제로나 청소 우수 등과 연계된 펀드로 협동심을 길러요."
      },
      {
        question: "투자의 손실 위험을 최소화하기 위해 자산을 한 곳에 몰아넣지 않고 고르게 쪼개어 가입하는 방식은?",
        choices: ["① 분산 투자", "② 영끌 올인 투자"],
        correctIndex: 0,
        explain: "정답이에요! 고르게 쪼개어 나누는 분산 투자가 안전 자산 관리의 핵심 비결이랍니다."
      },
      {
        question: "우리 반 펀드로 설정하기 위해 좋은 약속은 무엇일까요?",
        choices: ["① 모두 지각하지 않고 등교하기", "② 급식 반찬 두 배로 남기기"],
        correctIndex: 0,
        explain: "정답이에요! 구성원 모두가 지각하지 않는 습관을 가질 때 펀드 성공과 상생 이익이 함께 와요."
      }
    ]
  },
  {
    stageNum: 5,
    title: "가장 안전한 돈 늘리기, 예금",
    item: "마법의 왕도토리",
    itemEmoji: "🌰",
    monsterName: "지출유혹 도깨비",
    monsterEmoji: "👹",
    playerStart: { x: 0, y: 5 },
    chestPos: { x: 11, y: 0 },
    obstacles: [
      { x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 },
      { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 },
      { x: 9, y: 0 }, { x: 9, y: 1 }, { x: 9, y: 2 }
    ],
    puddles: [
      { x: 2, y: 4 }, { x: 5, y: 1 }, { x: 8, y: 4 }, { x: 10, y: 2 }
    ],
    concepts: [
      {
        title: "만기일 준수의 정석",
        text: "예금 가입 시 7일 또는 14일 동안 해지하지 않겠다는 약속 기한인 '만기일'을 지켜야 해요! 중도 해지하지 않고 만기일에 도달해야 약정 금리 100%의 풍성한 이자를 보장받을 수 있어요."
      },
      {
        title: "돈을 안전하게 가두어 불리는 '예금'",
        text: "소중한 돈을 잃지 않고 늘리는 가장 확실한 방법은 예금이에요! 내가 가진 목돈을 은행에 일정 기간 동안 안전하게 가두어 두면, 은행이 확실하고 든든한 약속 보너스 돈인 '이자'를 줍니다."
      },
      {
        title: "복리의 마법과 시간",
        text: "원금뿐만 아니라 불어난 이자에도 새 이자가 겹겹이 달라붙어 자산이 눈덩이처럼 기하급수적으로 불어나는 원리를 '복리의 마법'이라고 해요. 저축 기간이 길어질수록 마법의 힘은 강력해져요!"
      }
    ],
    quizzes: [
      {
        question: "안전하게 내 목돈을 맡긴 보답이자 고마움의 덤으로 은행이 당초 금리에 따라 더해 주는 보너스 돈은?",
        choices: ["① 벌금", "② 이자"],
        correctIndex: 1,
        explain: "정답이에요! 예금 상품에 가입하면 기간 만기 시 확정된 이율에 따라 '이자'를 지급받아요."
      },
      {
        question: "예금 상품에 가입한 후 당초 약속한 저축 계약 기간이 완전히 가득 차서 보너스 이자를 타는 뜻깊은 날은?",
        choices: ["① 예금 만기일", "② 학교 방학식"],
        correctIndex: 0,
        explain: "정답이에요! 가입할 때 정한 저축 약정 기한이 끝나는 '만기일'에 도달해야 가치가 빛나요."
      },
      {
        question: "이자에도 새로운 이자가 꼬리를 물며 붙어 시간이 흐를수록 자산이 마법처럼 급격히 팽창하는 저축 계산법은?",
        choices: ["① 복리 (Compound interest)", "② 단리 (Simple interest)"],
        correctIndex: 0,
        explain: "정답이에요! 저축 기한을 잘 유지해 복리 효과를 유도하는 것이 현명한 부자가 되는 첫걸음이에요."
      }
    ]
  },
  {
    stageNum: 6,
    title: "아름다운 활동, 경제시민",
    item: "천사의 날개 배지",
    itemEmoji: "👼",
    monsterName: "욕심쟁이 드래곤",
    monsterEmoji: "🐉",
    playerStart: { x: 0, y: 0 },
    chestPos: { x: 11, y: 5 },
    obstacles: [
      { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 },
      { x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 },
      { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 }
    ],
    puddles: [
      { x: 1, y: 4 }, { x: 4, y: 5 }, { x: 7, y: 1 }, { x: 10, y: 2 }
    ],
    concepts: [
      {
        title: "기부왕",
        text: "자신이 갖고 있는 자산을 학급 공동으로 모금할 수 있습니다. 모인 기부금은 학급 활동에 사용되거나 실제 기부 활동과 연계되어 활동하는 등 다양하게 활용할 수 있어요."
      },
      {
        title: "경제뉴스",
        text: "선생님이 설정하신 다양한 경제 뉴스들을 살펴보고 나의 생각을 적을 수 있어요."
      },
      {
        title: "경제상식",
        text: "경제 상식에 들어가면 금융경제와 관련된 다양한 읽기자료들을 읽을 수 있어요."
      },
      {
        title: "경제자판",
        text: "금융경제와 관련된 다양한 지식들을 자판 연습을 통해 학습할 수 있어요."
      }
    ],
    quizzes: [
      {
        question: "다양한 금융경제와 관련된 지식들을 자판 연습을 배울 수 있는 기능은?",
        choices: ["① 경제자판", "② 경제뉴스"],
        correctIndex: 0,
        explain: "정답이에요! 경제자판을 통해 재미있게 타자연습을 하며 금융지식도 쌓을 수 있어요."
      },
      {
        question: "클래스뱅크에서 경제와 관련된 다양한 읽기자료를 살펴볼 수 있는 곳은 어디인가요?",
        choices: ["① 도서관", "② 경제상식"],
        correctIndex: 1,
        explain: "정답이에요! 경제상식 탭에서 금융과 경제를 깊이 있게 읽고 배울 수 있어요."
      }
    ]
  }
];

const STAGE_THEMES: Record<number, {
  gridBg: string;
  tileBg: string;
  tileBorder: string;
  tileHover: string;
  themeName: string;
  accentText: string;
}> = {
  1: {
    gridBg: 'bg-emerald-50/30 border-emerald-200/50',
    tileBg: 'bg-emerald-50/40',
    tileBorder: 'border-emerald-100/40',
    tileHover: 'hover:bg-emerald-100/60',
    themeName: '🌿 푸른 새싹 초원',
    accentText: 'text-emerald-700 bg-emerald-50 border-emerald-100'
  },
  2: {
    gridBg: 'bg-amber-50/30 border-amber-200/50',
    tileBg: 'bg-amber-50/40',
    tileBorder: 'border-amber-100/40',
    tileHover: 'hover:bg-amber-100/60',
    themeName: '🍁 가을 단풍 숲',
    accentText: 'text-amber-700 bg-amber-50 border-amber-100'
  },
  3: {
    gridBg: 'bg-blue-50/30 border-blue-200/50',
    tileBg: 'bg-blue-50/40',
    tileBorder: 'border-blue-100/40',
    tileHover: 'hover:bg-blue-100/60',
    themeName: '💻 미래 지식 도시',
    accentText: 'text-blue-700 bg-blue-50 border-blue-100'
  },
  4: {
    gridBg: 'bg-pink-50/30 border-pink-200/50',
    tileBg: 'bg-pink-50/40',
    tileBorder: 'border-pink-100/40',
    tileHover: 'hover:bg-pink-100/60',
    themeName: '🌸 분홍 벚꽃 정원',
    accentText: 'text-pink-700 bg-pink-50 border-pink-100'
  },
  5: {
    gridBg: 'bg-violet-50/30 border-violet-200/50',
    tileBg: 'bg-violet-50/40',
    tileBorder: 'border-violet-100/40',
    tileHover: 'hover:bg-violet-100/60',
    themeName: '🔮 보라 신비 섬',
    accentText: 'text-violet-700 bg-violet-50 border-violet-100'
  },
  6: {
    gridBg: 'bg-orange-50/30 border-orange-200/50',
    tileBg: 'bg-orange-50/40',
    tileBorder: 'border-orange-100/40',
    tileHover: 'hover:bg-orange-100/60',
    themeName: '👑 황금 보물 성',
    accentText: 'text-amber-700 bg-amber-50 border-amber-100'
  }
};

export const EconomyTutorialModal: React.FC<EconomyTutorialModalProps> = ({ isOpen, onClose, userId, userName, onComplete }) => {
  const [currentStage, setCurrentStage] = useState(1);
  const [stageCleared, setStageCleared] = useState<Record<number, boolean>>({});
  
  // Game state within the active stage
  // 'intro' -> 'map' -> 'battle' -> 'chest_quest' -> 'stage_clear'
  const [gamePhase, setGamePhase] = useState<'intro' | 'map' | 'battle' | 'chest_quest' | 'stage_clear'>('intro');
  const [playerPosition, setPlayerPosition] = useState<Point>({ x: 0, y: 5 });
  
  // Advanced Multi-Monster, Puddle & Quiz state
  interface Monster {
    id: number;
    pos: Point;
    name: string;
    emoji: string;
    defeated: boolean;
    conceptIdx: number;
  }
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [activeMonsterIdx, setActiveMonsterIdx] = useState<number | null>(null);
  const [completedQuizCount, setCompletedQuizCount] = useState<number>(0);
  const [puddleDelay, setPuddleDelay] = useState<number>(0);
  const [virtualInteracted, setVirtualInteracted] = useState<boolean>(false);
  
  // Quiz
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [damageEffect, setDamageEffect] = useState(false);

  // Keyboard navigation & obstacle breaking states
  const [playerDirection, setPlayerDirection] = useState<'up' | 'down' | 'left' | 'right'>('down');
  const [brokenObstacles, setBrokenObstacles] = useState<Point[]>([]);
  const [obstacleHits, setObstacleHits] = useState<Record<string, number>>({});
  const [lastObstacleHit, setLastObstacleHit] = useState<{ name: string; remaining: number } | null>(null);
  const [chestPos, setChestPos] = useState<Point>({ x: 11, y: 0 });
  const [stage2Tab, setStage2Tab] = useState<'mart' | 'friend' | 'teacher'>('friend');

  // Custom interactive states for Stock (Stage 3) and Fund (Stage 4)
  const [stage3Tab, setStage3Tab] = useState<'start' | 'mine'>('start');
  const [selectedStockIdx, setSelectedStockIdx] = useState<number | null>(null);
  const [stage3Step, setStage3Step] = useState<'none' | 'clicked_stock' | 'clicked_buy' | 'clicked_sell'>('none');
  const [stage3TimerActive, setStage3TimerActive] = useState<boolean>(false);
  const [stage4Clicked, setStage4Clicked] = useState<boolean>(false);
  const [stage4Success, setStage4Success] = useState<boolean>(false);

  // Focus ref for capturing keyboard inputs instantly
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow the modal to finish animating/rendering before focusing
      const timer = setTimeout(() => {
        modalContainerRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, gamePhase]);

  // Load saved progress from LocalStorage
  useEffect(() => {
    if (isOpen && userId) {
      try {
        const savedStage = localStorage.getItem(`classbank_tutorial_stage_v2_${userId}`);
        const savedCleared = localStorage.getItem(`classbank_tutorial_cleared_v2_${userId}`);
        
        if (savedStage) {
          const s = parseInt(savedStage);
          if (!isNaN(s)) {
            setCurrentStage(s > 7 ? 7 : s);
          } else {
            setCurrentStage(1);
          }
        } else {
          setCurrentStage(1);
        }

        if (savedCleared) {
          setStageCleared(JSON.parse(savedCleared));
        } else {
          setStageCleared({});
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen, userId]);

  // Whenever stage changes, reset the mini-game states for that stage
  useEffect(() => {
    if (currentStage >= 1 && currentStage <= 6) {
      const cfg = STAGES[currentStage - 1];
      setPlayerPosition(cfg.playerStart);
      setGamePhase('intro');
      setQuizAnswer(null);
      setDamageEffect(false);
      setCompletedQuizCount(0);
      setPuddleDelay(0);
      setVirtualInteracted(false);
      setActiveMonsterIdx(null);
      setPlayerDirection('down');
      setBrokenObstacles([]);
      setObstacleHits({});
      setLastObstacleHit(null);
      setChestPos(cfg.chestPos);
      setStage2Tab('friend');
      setStage3Tab('start');
      setSelectedStockIdx(null);
      setStage3Step('none');
      setStage3TimerActive(false);
      setStage4Clicked(false);
      setStage4Success(false);

      // static monster positions per stage across 12x6 grid
      const stageMonsterPositions = [
        [{ x: 3, y: 2 }, { x: 6, y: 4 }, { x: 9, y: 2 }],
        [{ x: 4, y: 3 }, { x: 8, y: 2 }],
        [{ x: 3, y: 2 }, { x: 6, y: 4 }, { x: 8, y: 2 }],
        [{ x: 4, y: 2 }, { x: 6, y: 4 }, { x: 8, y: 2 }],
        [{ x: 3, y: 2 }, { x: 6, y: 4 }, { x: 9, y: 2 }],
        [{ x: 4, y: 2 }, { x: 7, y: 4 }, { x: 9, y: 2 }, { x: 10, y: 0 }],
      ][currentStage - 1] || [];

      const initialMonsters = stageMonsterPositions.map((pos, idx) => ({
        id: idx,
        pos,
        name: `${cfg.monsterName} ${idx + 1}호`,
        emoji: cfg.monsterEmoji,
        defeated: false,
        conceptIdx: idx
      }));

      setMonsters(initialMonsters);
    } else if (currentStage === 7) {
      setGamePhase('stage_clear'); // final stage is just the certificate
    }
  }, [currentStage]);

  // Save progress
  const saveProgress = (stage: number, cleared: Record<number, boolean>) => {
    try {
      localStorage.setItem(`classbank_tutorial_stage_v2_${userId}`, String(stage));
      localStorage.setItem(`classbank_tutorial_cleared_v2_${userId}`, JSON.stringify(cleared));
    } catch (e) {
      console.error(e);
    }
  };

  const resetAll = () => {
    if (window.confirm("금융 가이드 모험을 처음부터 다시 시작하시겠습니까?")) {
      setCurrentStage(1);
      setStageCleared({});
      setGamePhase('intro');
      setQuizAnswer(null);
      setDamageEffect(false);
      setCompletedQuizCount(0);
      setPuddleDelay(0);
      setVirtualInteracted(false);
      setActiveMonsterIdx(null);
      setPlayerDirection('down');
      setBrokenObstacles([]);
      setObstacleHits({});
      setLastObstacleHit(null);
      setChestPos({ x: 11, y: 0 });
      setStage2Tab('friend');
      setStage3Tab('start');
      setSelectedStockIdx(null);
      setStage3Step('none');
      setStage3TimerActive(false);
      setStage4Clicked(false);
      setStage4Success(false);
      try {
        localStorage.removeItem(`classbank_tutorial_stage_v2_${userId}`);
        localStorage.removeItem(`classbank_tutorial_cleared_v2_${userId}`);
        localStorage.removeItem(`classbank_tutorial_completed_v2_${userId}`);
      } catch (e) {
        console.error(e);
      }
      onComplete();
    }
  };

  const handleSaveImage = () => {
    if (!certificateRef.current) return;
    html2canvas(certificateRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    }).then((canvas) => {
      const link = document.createElement('a');
      link.download = `클래스뱅크_이수증_${userName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch((err) => {
      console.error('Error generating image:', err);
    });
  };

  const currentConfig = STAGES[currentStage - 1] || STAGES[0];

  const activeObstacles = currentConfig?.obstacles
    ? currentConfig.obstacles.filter(obs => !brokenObstacles.some(bo => bo.x === obs.x && bo.y === obs.y))
    : [];

  const renderPlayerAvatar = () => {
    switch (playerDirection) {
      case 'left':
        return <span className="inline-block -scale-x-100 transition-transform">🧙‍♂️</span>;
      case 'right':
        return <span className="inline-block scale-x-100 transition-transform">🧙‍♂️</span>;
      case 'up':
        return <span className="inline-block grayscale brightness-[0.4] contrast-125 transition-transform">🧙‍♂️</span>;
      case 'down':
      default:
        return <span className="inline-block transition-transform">🧙‍♂️</span>;
    }
  };

  const getObstacleMaxHits = (x: number, y: number) => {
    const type = (x + y) % 3;
    if (type === 0) return 5; // 돌 (🪨)
    if (type === 1) return 4; // 나무 (🌲)
    return 3; // 벽돌 (🧱)
  };

  const getObstacleName = (x: number, y: number) => {
    const type = (x + y) % 3;
    if (type === 0) return '돌 🪨';
    if (type === 1) return '나무 🌲';
    return '벽돌 🧱';
  };

  const handleBreakObstacle = () => {
    let targetX = playerPosition.x;
    let targetY = playerPosition.y;
    if (playerDirection === 'up') targetY -= 1;
    else if (playerDirection === 'down') targetY += 1;
    else if (playerDirection === 'left') targetX -= 1;
    else if (playerDirection === 'right') targetX += 1;

    const facingObstacle = activeObstacles.find(obs => obs.x === targetX && obs.y === targetY);
    let targetObstacle = facingObstacle;
    if (!targetObstacle) {
      // Fallback: any adjacent obstacle
      targetObstacle = activeObstacles.find(obs => 
        Math.abs(obs.x - playerPosition.x) + Math.abs(obs.y - playerPosition.y) === 1
      );
    }

    if (targetObstacle) {
      const key = `${targetObstacle.x},${targetObstacle.y}`;
      const maxHits = getObstacleMaxHits(targetObstacle.x, targetObstacle.y);
      const name = getObstacleName(targetObstacle.x, targetObstacle.y);
      const currentHits = (obstacleHits[key] || 0) + 1;

      if (currentHits >= maxHits) {
        // Break!
        setBrokenObstacles(prev => [...prev, targetObstacle!]);
        // Remove from hits record
        setObstacleHits(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setLastObstacleHit(null); // Obstacle is fully gone
      } else {
        setObstacleHits(prev => ({
          ...prev,
          [key]: currentHits
        }));
        setLastObstacleHit({
          name,
          remaining: maxHits - currentHits
        });
      }
      return;
    }
  };

  const handleVirtualInteract = () => {
    setVirtualInteracted(true);
  };

  const getBattleHighlightClass = (isActive: boolean) => {
    if (!isActive) return '';
    if (virtualInteracted) {
      return 'bg-emerald-50 border-2 border-emerald-500 ring-4 ring-emerald-300 scale-102 border-dashed text-emerald-800 font-extrabold';
    }
    return 'bg-amber-100 border-2 border-amber-500 ring-4 ring-amber-400 animate-pulse scale-[1.05] shadow-xl shadow-amber-300 font-black text-amber-950';
  };

  // Helper to check if point has obstacle
  const isObstacle = (p: Point, obstacles: Point[]) => {
    return obstacles.some(obs => obs.x === p.x && obs.y === p.y);
  };

  // Autonomous continuous movement for monsters (independent of player moves)
  useEffect(() => {
    if (gamePhase !== 'map' || monsters.every(m => m.defeated)) return;

    const interval = setInterval(() => {
      setMonsters(prev => {
        const updatedMonsters = prev.map(m => {
          if (m.defeated) return m;

          // Pick an orthogonal direction
          const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
          const validDirs = dirs.filter(d => {
            const tx = m.pos.x + d.x;
            const ty = m.pos.y + d.y;
            const oob = tx < 0 || tx >= 12 || ty < 0 || ty >= 6;
            const playerAt = playerPosition.x === tx && playerPosition.y === ty;
            const obsAt = isObstacle({ x: tx, y: ty }, activeObstacles);
            return !oob && !playerAt && !obsAt;
          });

          if (validDirs.length > 0) {
            // Pick a direction that maximizes distance to player (escaping player)
            let maxDist = -1;
            let bestDirs: { x: number, y: number }[] = [];

            validDirs.forEach(d => {
              const tx = m.pos.x + d.x;
              const ty = m.pos.y + d.y;
              const dist = Math.abs(tx - playerPosition.x) + Math.abs(ty - playerPosition.y);
              if (dist > maxDist) {
                maxDist = dist;
                bestDirs = [d];
              } else if (dist === maxDist) {
                bestDirs.push(d);
              }
            });

            const chosenDir = bestDirs[Math.floor(Math.random() * bestDirs.length)];
            return { ...m, pos: { x: m.pos.x + chosenDir.x, y: m.pos.y + chosenDir.y } };
          }
          return m;
        });

        // Check if any monster moved directly onto the player
        const activeMonster = updatedMonsters.find(m => !m.defeated && (
          m.pos.x === playerPosition.x && m.pos.y === playerPosition.y
        ));

        if (activeMonster) {
          setTimeout(() => {
            setActiveMonsterIdx(activeMonster.id);
            setVirtualInteracted(false); // Reset interaction state for the new battle!
            setGamePhase('battle');
          }, 50);
        }

        return updatedMonsters;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [gamePhase, playerPosition, monsters, currentStage, brokenObstacles]);

  // Move player handler (keyboard & gamepad arrow keys)
  const handleMove = (dx: number, dy: number, isVirtual: boolean = false) => {
    if (gamePhase !== 'map') return;
    if (isVirtual) {
      setVirtualInteracted(true);
    }

    // Direction tracking
    if (dx > 0) setPlayerDirection('right');
    else if (dx < 0) setPlayerDirection('left');
    else if (dy > 0) setPlayerDirection('down');
    else if (dy < 0) setPlayerDirection('up');

    // Puddle delayed movement penalty: if player is delayed, do not move player.
    if (puddleDelay > 0) {
      setPuddleDelay(prev => prev - 1);
      return;
    }

    const nextX = playerPosition.x + dx;
    const nextY = playerPosition.y + dy;

    // 12x6 Boundary check
    if (nextX < 0 || nextX >= 12 || nextY < 0 || nextY >= 6) return;

    const nextPoint = { x: nextX, y: nextY };

    // Obstacle check
    if (isObstacle(nextPoint, activeObstacles)) return;

    setPlayerPosition(nextPoint);
    setLastObstacleHit(null);

    // Puddle check: delay penalty of 2 steps
    const steppedOnPuddle = currentConfig.puddles.some(p => p.x === nextPoint.x && p.y === nextPoint.y);
    if (steppedOnPuddle) {
      setPuddleDelay(2);
    }

    // Check overlapping monster trigger (only exact same tile)
    const activeMonster = monsters.find(m => !m.defeated && (
      m.pos.x === nextPoint.x && m.pos.y === nextPoint.y
    ));

    if (activeMonster) {
      setActiveMonsterIdx(activeMonster.id);
      setVirtualInteracted(false); // Reset interaction state for the new battle!
      setGamePhase('battle');
    }

    // Check chest trigger: only when all monsters are defeated
    const allDefeated = monsters.every(m => m.defeated);
    if (allDefeated) {
      const reachedChest = nextPoint.x === chestPos.x && nextPoint.y === chestPos.y;
      if (reachedChest) {
        setCompletedQuizCount(0);
        setQuizAnswer(null);
        setGamePhase('chest_quest');
      }
    }
  };

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gamePhase !== 'map') return;
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        e.preventDefault();
        handleMove(0, -1);
      } else if (key === 'arrowdown' || key === 's') {
        e.preventDefault();
        handleMove(0, 1);
      } else if (key === 'arrowleft' || key === 'a') {
        e.preventDefault();
        handleMove(-1, 0);
      } else if (key === 'arrowright' || key === 'd') {
        e.preventDefault();
        handleMove(1, 0);
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handleBreakObstacle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamePhase, playerPosition, monsters, puddleDelay, currentStage, playerDirection, brokenObstacles, obstacleHits]);

  // Direct tile click navigation for fluid experience
  const handleTileClick = (target: Point) => {
    if (gamePhase !== 'map') return;
    const dist = Math.abs(target.x - playerPosition.x) + Math.abs(target.y - playerPosition.y);
    if (dist === 1) {
      const dx = target.x - playerPosition.x;
      const dy = target.y - playerPosition.y;
      handleMove(dx, dy, false);
    }
  };

  // Battle Slash Attack
  const handleAttackMonster = () => {
    setDamageEffect(true);
    setTimeout(() => {
      setDamageEffect(false);
      
      let isLast = false;
      setMonsters(prev => {
        const next = prev.map(m => {
          if (m.id === activeMonsterIdx) {
            return { ...m, defeated: true };
          }
          return m;
        });
        if (next.every(m => m.defeated)) {
          isLast = true;
        }
        return next;
      });

      if (isLast) {
        let bestPoint = currentConfig.chestPos;
        let maxDist = -1;
        for (let x = 0; x < 12; x++) {
          for (let y = 0; y < 6; y++) {
            const p = { x, y };
            const hasObstacle = activeObstacles.some(obs => obs.x === x && obs.y === y);
            if (hasObstacle) continue;
            const dist = Math.abs(x - playerPosition.x) + Math.abs(y - playerPosition.y);
            if (dist > maxDist) {
              maxDist = dist;
              bestPoint = p;
            }
          }
        }
        setChestPos(bestPoint);
      }

      setActiveMonsterIdx(null);
      setGamePhase('map'); // Return to map to defeat other monsters or open chest
    }, 800);
  };

  // Submit Quiz Answer
  const handleQuizAnswerSubmit = (index: number) => {
    setQuizAnswer(index);
  };

  // Proceed with multiple quizzes or end stage
  const handleNextQuiz = () => {
    if (completedQuizCount < currentConfig.quizzes.length - 1) {
      setCompletedQuizCount(prev => prev + 1);
      setQuizAnswer(null);
    } else {
      const updatedCleared = { ...stageCleared, [currentStage]: true };
      setStageCleared(updatedCleared);
      saveProgress(currentStage, updatedCleared);
      setGamePhase('stage_clear');
    }
  };

  // Go to next stage
  const handleNextStage = () => {
    if (currentStage < 6) {
      setCurrentStage(prev => prev + 1);
    } else if (currentStage === 6) {
      setCurrentStage(7);
      try {
        localStorage.setItem(`classbank_tutorial_completed_v2_${userId}`, 'true');
        onComplete();
        window.dispatchEvent(new Event('tutorialUpdate'));
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[200] p-3 overflow-y-auto no-print"
        >
          {/* Print Stylesheet */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body {
                background-color: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
              .print-certificate-container {
                display: block !important;
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                padding: 10mm !important;
                margin: 0 !important;
                box-sizing: border-box !important;
                background: white !important;
                z-index: 9999999 !important;
              }
              .print-border-frame {
                border: 10px double #D4AF37 !important;
                padding: 15mm !important;
                height: 265mm !important;
                background: white !important;
                position: relative !important;
                box-sizing: border-box !important;
              }
            }
          `}} />

          <motion.div
            ref={modalContainerRef}
            tabIndex={0}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-white rounded-[32px] shadow-2xl border border-gray-100 max-w-5xl w-full flex flex-col h-[92vh] md:h-[88vh] overflow-hidden relative outline-none"
          >
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🎓</span>
                <div>
                  <h3 className="font-black text-base text-gray-950 tracking-tight">클래스뱅크 금융 가이드</h3>
                  <p className="text-[10px] text-gray-500 font-bold">초등 경제 원리를 배우는 미니 게임 모험</p>
                </div>
              </div>
            
              <div className="flex items-center gap-3">
                <button 
                  onClick={onClose} 
                  className="p-1.5 bg-white rounded-full hover:bg-gray-100 border border-gray-200 shadow-xs transition-colors cursor-pointer"
                >
                  <XIcon className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Level indicators */}
            {currentStage <= 6 && (
              <div className="px-4 py-3 bg-indigo-50/50 border-b-2 border-slate-300 shrink-0 flex items-center justify-between overflow-x-auto whitespace-nowrap scrollbar-none">
                <div className="flex items-center gap-1.5 mx-auto">
                  {[1, 2, 3, 4, 5, 6].map((stg) => {
                    const isClear = stageCleared[stg];
                    const isActive = currentStage === stg;
                    return (
                      <React.Fragment key={stg}>
                        <button
                          onClick={() => {
                            if (stg === 1 || stageCleared[stg - 1]) {
                              setCurrentStage(stg);
                            }
                          }}
                          disabled={!(stg === 1 || stageCleared[stg - 1])}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-xs border-2 border-indigo-700'
                              : isClear
                              ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-400'
                              : 'bg-white border-2 border-slate-300 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span className="font-mono text-[9px] opacity-75">{stg}단계</span>
                          {isClear && <span>✅</span>}
                        </button>
                        {stg < 6 && <div className={`w-3 ${isClear ? 'bg-emerald-400 h-[3px]' : 'bg-slate-300 h-[2px]'}`} />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main Body */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left side: Game screen/Playground */}
            {currentStage <= 6 ? (
              <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-50 border-b md:border-b-0 md:border-r border-gray-100 justify-between overflow-y-auto">
                
                {/* Visual game screen depending on phase */}
                <div className="flex-1 flex flex-col justify-center items-center min-h-[280px]">
                  {gamePhase === 'intro' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs max-w-sm w-full text-center space-y-4"
                    >
                      <div className="text-4xl">🏹</div>
                      <div>
                        <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase bg-indigo-50 px-2 py-0.5 rounded-full">Stage {currentStage}</span>
                        <h4 className="font-black text-gray-900 mt-1 text-base">{currentConfig.title}</h4>
                      </div>
                      <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                        모험을 시작하기 전에 길을 가로막고 있는 <strong className="text-red-500">[{currentConfig.monsterName}]</strong>를 찾으러 지도를 건너가세요!
                      </p>
                      <button
                        onClick={() => setGamePhase('map')}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-transform hover:scale-[1.02] cursor-pointer"
                      >
                        지도 열기 🗺️
                      </button>
                    </motion.div>
                  )}

                  {gamePhase === 'map' && (() => {
                    const theme = STAGE_THEMES[currentStage] || STAGE_THEMES[1];
                    return (
                      <div className="space-y-4 w-full max-w-xl">
                        {/* Interactive Title */}
                        <div className="text-center">
                          <span className={`text-xs font-black px-3.5 py-1.5 rounded-full border shadow-xs transition-colors duration-300 ${theme.accentText}`}>
                            {monsters.every(m => m.defeated) 
                              ? '🎁 모든 몬스터 소탕 완료! 보물상자(🔑)로 이동하세요!' 
                              : `👾 ${theme.themeName} 수련 단계 (남은 몬스터: ${monsters.filter(m => !m.defeated).length}마리)`}
                          </span>
                        </div>

                        {/* Always present fixed guidance banner to prevent layout shift */}
                        <div className="h-11 flex items-center justify-center bg-indigo-50 border-2 border-indigo-200 rounded-xl px-4 text-center select-none shadow-xs">
                          <span className="text-xs font-black text-indigo-950 leading-tight">
                            {(() => {
                              // 1. Puddle Check
                              if (puddleDelay > 0 && currentConfig.puddles.some(p => p.x === playerPosition.x && p.y === playerPosition.y)) {
                                return "⚠️ 물 웅덩이에 빠졌습니다! 한 번 더 눌러야 움직일 수 있습니다. (이동 버튼 이나 방향키 입력)";
                              }
                              // 2. Obstacle Attack Check
                              if (lastObstacleHit) {
                                return `🔨 ${lastObstacleHit.name}을 공격했습니다! 앞으로 ${lastObstacleHit.remaining}번 더 공격해서 장애물을 없애주세요.`;
                              }
                              // 3. All monsters defeated (chest appeared)
                              const allDefeated = monsters.every(m => m.defeated);
                              if (allDefeated) {
                                return "🎁 보물상자로 이동해서 보물을 획득하세요.";
                              }
                              // 4. Default walking / doing nothing
                              return "⚔️ 움직이는 몬스터를 공격하세요.";
                            })()}
                          </span>
                        </div>

                        {/* Map Board */}
                        <div className={`grid grid-cols-12 gap-1 p-2 bg-white rounded-2xl shadow-md border-2 border-slate-300 w-full overflow-hidden transition-all duration-300 relative ${theme.gridBg}`}>
                          {Array.from({ length: 6 }).map((_, y) => (
                            Array.from({ length: 12 }).map((_, x) => {
                              const isPlayer = playerPosition.x === x && playerPosition.y === y;
                              const hasObstacle = isObstacle({ x, y }, activeObstacles);
                              const hasPuddle = currentConfig.puddles.some(p => p.x === x && p.y === y);
                              
                              // Check if adjacent to player (clickable to move)
                              const isAdjacent = Math.abs(x - playerPosition.x) + Math.abs(y - playerPosition.y) === 1;

                              // Determine obstacle appearance
                              let tileIcon = null;
                              if (hasObstacle) {
                                const obstacleType = (x + y) % 3;
                                tileIcon = obstacleType === 0 ? '🪨' : obstacleType === 1 ? '🌲' : '🧱';
                              } else if (hasPuddle) {
                                tileIcon = '💧';
                              }

                              return (
                                <button
                                  key={`${x}-${y}`}
                                  onClick={() => handleTileClick({ x, y })}
                                  disabled={hasObstacle}
                                  className={`aspect-square rounded-lg flex items-center justify-center text-sm md:text-base relative transition-all duration-200 ${
                                    isPlayer 
                                      ? 'bg-indigo-50 border-2 border-indigo-500/30 shadow-xs' 
                                      : hasObstacle 
                                      ? 'bg-slate-100 text-slate-400 font-bold border-2 border-slate-200' 
                                      : hasPuddle
                                      ? 'bg-blue-50/60 hover:bg-blue-100/60 border border-blue-100 cursor-pointer animate-pulse'
                                      : isAdjacent
                                      ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer'
                                      : `${theme.tileBg} border ${theme.tileBorder} ${theme.tileHover}`
                                  }`}
                                >
                                  {!isPlayer && tileIcon}
                                </button>
                              );
                            })
                          ))}

                          {/* Dynamic Entity Overlay Layer for Smooth Movement (Framer Motion grid-based Layout Animations) */}
                          <div className="absolute inset-0 p-2 grid grid-cols-12 grid-rows-6 gap-1 pointer-events-none w-full h-full">
                            {/* Player Entity */}
                            <motion.div
                              layout
                              transition={{ type: "spring", stiffness: 350, damping: 25 }}
                              style={{
                                gridColumnStart: playerPosition.x + 1,
                                gridRowStart: playerPosition.y + 1,
                              }}
                              className="aspect-square flex items-center justify-center select-none z-10"
                            >
                              <span className="text-base md:text-lg">{renderPlayerAvatar()}</span>
                            </motion.div>

                            {/* Active Monsters Entities */}
                            {monsters.map((m) => {
                              if (m.defeated) return null;
                              return (
                                <motion.div
                                  key={`monster-overlay-${m.id}`}
                                  layout
                                  transition={{ type: "spring", stiffness: 270, damping: 22 }}
                                  style={{
                                    gridColumnStart: m.pos.x + 1,
                                    gridRowStart: m.pos.y + 1,
                                  }}
                                  className="aspect-square flex items-center justify-center select-none"
                                >
                                  <span className="text-base md:text-lg animate-bounce inline-block">
                                    {m.emoji}
                                  </span>
                                </motion.div>
                              );
                            })}

                            {/* Treasure Chest Entity */}
                            {monsters.every(m => m.defeated) && (
                              <motion.div
                                layout
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                style={{
                                  gridColumnStart: chestPos.x + 1,
                                  gridRowStart: chestPos.y + 1,
                                }}
                                className="aspect-square flex items-center justify-center text-base md:text-lg animate-pulse select-none"
                              >
                                🎁
                              </motion.div>
                            )}
                          </div>
                        </div>

                        {/* Keyboard / Controller Instructions */}
                        <div className="bg-slate-100/90 border-2 border-slate-300 rounded-xl p-3 text-center space-y-1">
                          <p className="text-[10px] text-slate-700 font-bold flex items-center justify-center gap-1.5 flex-wrap">
                            <span>🎮 <strong>조작법 안내:</strong></span>
                            <span className="bg-white border-2 border-slate-300 px-1.5 py-0.5 rounded shadow-2xs font-mono">WASD / 방향키</span>
                            <span>이동</span>
                            <span className="text-slate-400">|</span>
                            <span className="bg-white border-2 border-slate-300 px-1.5 py-0.5 rounded shadow-2xs font-mono">Spacebar</span>
                            <span>앞의 장애물(🪨/🌲/🧱) 부수기 🔨</span>
                          </p>
                          <p className="text-[9px] text-slate-500 font-bold">
                            * 마우스로 캐릭터 주변의 초록색 타일을 직접 클릭하여 한 칸씩 이동할 수도 있어요!
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {gamePhase === 'battle' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-xs max-w-sm w-full text-center space-y-4 transition-all duration-500 ${damageEffect ? 'opacity-0 scale-[0.98]' : 'opacity-100'}`}
                    >
                      <div className="text-5xl">{currentConfig.monsterEmoji}</div>
                      <div>
                        <h4 className="font-black text-red-500 text-sm">⚔️ 전투 발생! ⚔️</h4>
                        <p className="font-black text-gray-900 text-base mt-1">[{currentConfig.monsterName}]가 길을 막았다!</p>
                      </div>
                      <p className="text-xs text-gray-600 font-semibold leading-relaxed bg-red-50 p-3 rounded-2xl border border-red-100">
                        "나를 무찌르고 지나가고 싶다면, 이 경제 개념을 똑바로 정독하고 무기로 사용하거라!"
                      </p>
                      
                      {(() => {
                        const activeMonster = monsters.find(m => m.id === activeMonsterIdx);
                        const activeConcept = currentConfig.concepts[activeMonster?.conceptIdx ?? 0] || currentConfig.concepts[0];
                        return (
                          <div className="text-left bg-indigo-50 border border-indigo-100 p-4 rounded-2xl space-y-2">
                            <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-bold">필살 지식</span>
                            <h5 className="font-black text-xs text-gray-900">{activeConcept.title}</h5>
                            <p className="text-[10px] text-gray-600 leading-relaxed font-semibold whitespace-pre-wrap">
                              {activeConcept.text}
                            </p>
                          </div>
                        );
                      })()}

                      <button
                        onClick={handleAttackMonster}
                        disabled={!virtualInteracted}
                        className={`w-full py-3 text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 ${
                          virtualInteracted
                            ? 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-black animate-pulse cursor-pointer shadow-lg hover:shadow-xl'
                            : 'bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400 font-bold cursor-not-allowed opacity-75'
                        }`}
                      >
                        <span>
                          {virtualInteracted
                            ? '🪄 개념 암기 공격! (공격력 100)'
                            : '⚠️ 오른쪽 가상 화면을 먼저 조작하세요'}
                        </span>
                      </button>
                    </motion.div>
                  )}

                  {gamePhase === 'chest_quest' && (() => {
                    const activeQuiz = currentConfig.quizzes[completedQuizCount];
                    if (!activeQuiz) return null;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-6 rounded-3xl border-2 border-amber-500 shadow-md max-w-md w-full text-center space-y-4"
                      >
                        <div className="flex justify-between items-center pb-2 border-b-2 border-amber-200">
                          <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-black flex items-center gap-1 border border-amber-300">
                            📝 배움 확인 퀴즈 ({completedQuizCount + 1}/{currentConfig.quizzes.length})
                          </span>
                          <span className="text-[10px] text-indigo-600 font-black bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">관문 해제 중</span>
                        </div>

                        <p className="text-sm font-black text-gray-900 leading-relaxed bg-amber-50/20 p-3.5 rounded-xl border-2 border-amber-300">
                          {activeQuiz.question}
                        </p>
                        
                        <div className="space-y-2 text-left">
                          {activeQuiz.choices.map((choice, idx) => {
                            const isSelected = quizAnswer === idx;
                            const isCorrect = idx === activeQuiz.correctIndex;
                            return (
                              <button
                                key={idx}
                                onClick={() => handleQuizAnswerSubmit(idx)}
                                disabled={quizAnswer === activeQuiz.correctIndex}
                                className={`w-full p-3 rounded-xl text-left text-xs font-bold transition-all border-2 cursor-pointer flex items-center justify-between ${
                                  isSelected
                                    ? isCorrect
                                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-black'
                                      : 'bg-red-50 border-red-500 text-red-800 font-black'
                                    : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-slate-100'
                                }`}
                              >
                                <span>{choice}</span>
                                {isSelected && (
                                  <span className="text-[9px] font-bold shrink-0 ml-2">
                                    {isCorrect ? '정답! 🌟' : '오답 😢'}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {quizAnswer !== null && (
                          <div className="space-y-3 pt-1 text-left">
                            <p className="text-xs text-gray-500 leading-normal font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                              {quizAnswer === activeQuiz.correctIndex 
                                ? `👏 ${activeQuiz.explain}` 
                                : "틀렸어요! 다시 골라 정답을 맞춰봐요."}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })()}

                  {gamePhase === 'stage_clear' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs max-w-sm w-full text-center space-y-4"
                    >
                      <div className="text-6xl animate-bounce">{currentConfig.itemEmoji}</div>
                      <div>
                        <span className="text-xs text-emerald-600 font-bold">STAGE CLEAR</span>
                        <h4 className="font-black text-gray-900 text-base mt-1">{currentStage}단계 완벽 수련 성공!</h4>
                      </div>
                      <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                        [{currentConfig.item}]를 수령하였습니다. 이 도구는 완벽한 경제 시민 이수증을 발급하기 위한 에너지원이 됩니다!
                      </p>
                      
                      <button
                        onClick={handleNextStage}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-2"
                      >
                        <span>{currentStage === 6 ? '🏆 최종 수여식 가기 ➔' : '다음 단계 모험하기 ➔'}</span>
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Progress bar info */}
                <div className="mt-4 bg-white p-3 rounded-2xl border-2 border-slate-300 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎒</span>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block uppercase">획득한 아이템 목록</span>
                      <div className="flex gap-1.5 mt-0.5">
                        {STAGES.map((stg) => {
                          const isClear = !!stageCleared[stg.stageNum] || !!stageCleared[String(stg.stageNum) as any];
                          return (
                            <span 
                              key={stg.stageNum} 
                              className={`text-sm p-1 rounded-md border-2 transition-all duration-300 ${isClear ? 'bg-amber-50 border-amber-400 scale-110 shadow-xs' : 'bg-gray-50 border-gray-200 opacity-30'}`}
                              title={stg.item}
                            >
                              {stg.itemEmoji}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-indigo-600 font-black bg-indigo-50 px-2.5 py-1 rounded-lg">
                    Level {Object.keys(stageCleared).filter(k => stageCleared[Number(k)] || stageCleared[k as any]).length}/6
                  </span>
                </div>

              </div>
            ) : null}

            {/* Right side (Desktop) or Fullscreen (when stage is 7): Visual Mockup representations / Certificate */}
            {currentStage <= 6 ? (
              <div className="w-full md:w-[380px] p-4 md:p-6 overflow-y-auto flex flex-col justify-between shrink-0 bg-slate-100/40 border-l border-slate-300">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-black uppercase tracking-widest block">조작 가상 화면</span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                      실제 클래스뱅크
                    </span>
                  </div>

                  {/* High fidelity CSS Mockups simulating actual ClassBank pages */}
                  {currentStage === 1 && (() => {
                    const activeMonster = monsters.find(m => m.id === activeMonsterIdx);
                    const activeConceptIdx = activeMonster?.conceptIdx ?? 0;
                    
                    const isConcept0Battle = gamePhase === 'battle' && activeConceptIdx === 0;
                    const isConcept1Battle = gamePhase === 'battle' && activeConceptIdx === 1;
                    const isConcept2Battle = gamePhase === 'battle' && activeConceptIdx === 2;

                    const accountHeader = (
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="font-black text-xs text-gray-800">
                          {isConcept2Battle ? "📜 최근 활동" : "🏠 나의 홈 화면"}
                        </span>
                        <span 
                          onClick={() => {
                            if (isConcept1Battle) {
                              handleVirtualInteract();
                            }
                          }}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all select-none cursor-pointer ${
                            isConcept1Battle
                              ? getBattleHighlightClass(true)
                              : 'text-gray-500 bg-gray-100 border border-slate-200'
                          }`}
                        >
                          {isConcept1Battle && !virtualInteracted ? '👉 클래스뱅크 123-456-7890 (클릭!)' : '클래스뱅크 123-456-7890'}
                        </span>
                      </div>
                    );

                    if (isConcept2Battle) {
                      return (
                        <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
                          {accountHeader}
                          <div className="space-y-1.5">
                            <div className="text-[9px] text-gray-400 font-bold">최근 활동 내역</div>
                            <div 
                              onClick={() => {
                                if (isConcept2Battle) {
                                  handleVirtualInteract();
                                }
                              }}
                              className={`rounded-xl p-2.5 border transition-all cursor-pointer space-y-2 ${
                                isConcept2Battle
                                  ? getBattleHighlightClass(true)
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="text-[9px] text-indigo-500 font-bold block text-center">
                                {!virtualInteracted ? '🔍 여기에 마우스를 클릭해 거래내역을 조회하세요!' : '✅ 거래내역 조회 완료!'}
                              </div>
                              <div className="space-y-1.5 text-[9px] font-bold text-gray-700">
                                <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
                                  <span>7/12 학교 마트</span>
                                  <span className="text-red-500">-1,200원</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
                                  <span>7/11 용돈 입금</span>
                                  <span className="text-emerald-600">+10,000원</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>7/10 예적금 이자</span>
                                  <span className="text-emerald-600">+500원</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3 text-left">
                        {accountHeader}
                        
                        {/* '내 총 자산' 타이틀 좌측 정렬 추가 */}
                        <div className="text-[10px] text-gray-800 font-extrabold text-left">내 총 자산</div>
                        
                        <div 
                          onClick={() => {
                            if (isConcept0Battle) {
                              handleVirtualInteract();
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-1 ${
                            isConcept0Battle
                              ? getBattleHighlightClass(true)
                              : 'bg-indigo-50/60 border border-indigo-150'
                          }`}
                        >
                          <span className="text-[9px] text-gray-500 font-bold block">
                            {isConcept0Battle && !virtualInteracted ? '👉 내 총 자산 (클릭하여 조회!)' : '내 총 자산'}
                          </span>
                          <div className="flex justify-between items-baseline">
                            <span className="font-black text-gray-900 text-sm">15,000원</span>
                            {isConcept0Battle && virtualInteracted && (
                              <span className="text-[8px] text-emerald-600 font-bold">✅ 조회 완료</span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-[9px] font-bold text-gray-600">
                          <div className="bg-gray-50 p-1.5 rounded-lg text-center border border-slate-200">
                            <span className="block text-gray-400 text-[8px] font-semibold mb-0.5">현금</span>
                            <span className="font-black text-gray-800">5,000원</span>
                          </div>
                          <div className="bg-gray-50 p-1.5 rounded-lg text-center border border-slate-200">
                            <span className="block text-gray-400 text-[8px] font-semibold mb-0.5">주식</span>
                            <span className="font-black text-gray-800">2,000원</span>
                          </div>
                          <div className="bg-gray-50 p-1.5 rounded-lg text-center border border-slate-200">
                            <span className="block text-gray-400 text-[8px] font-semibold mb-0.5">예금</span>
                            <span className="font-black text-gray-800">8,000원</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {currentStage === 2 && (() => {
                    const activeMonster = monsters.find(m => m.id === activeMonsterIdx);
                    const activeConceptIdx = activeMonster?.conceptIdx ?? 0;

                    const isConcept0Battle = gamePhase === 'battle' && activeConceptIdx === 0;
                    const isConcept1Battle = gamePhase === 'battle' && activeConceptIdx === 1;

                    const isCorrectTabSelected = 
                      (isConcept0Battle && stage2Tab === 'mart') || 
                      (isConcept1Battle && stage2Tab === 'friend');

                    const getTabHighlight = (tab: 'mart' | 'friend' | 'teacher') => {
                      if (stage2Tab === tab) {
                        return 'bg-indigo-600 text-white border-indigo-600 shadow-sm';
                      }
                      if (gamePhase === 'battle' && !virtualInteracted) {
                        if (isConcept0Battle && tab === 'mart') {
                          return 'bg-amber-100 text-amber-800 border-2 border-amber-400 animate-pulse font-black';
                        }
                        if (isConcept1Battle && tab === 'friend') {
                          return 'bg-amber-100 text-amber-800 border-2 border-amber-400 animate-pulse font-black';
                        }
                      }
                      return 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-slate-200';
                    };

                    return (
                      <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
                        <span className="font-black text-xs text-gray-800 block pb-1 border-b border-gray-200">💸 송금하기</span>
                        
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            onClick={() => {
                              if (!virtualInteracted) setStage2Tab('mart');
                            }}
                            className={`py-1.5 px-1 rounded-lg text-[9px] font-bold border transition-all text-center cursor-pointer ${getTabHighlight('mart')}`}
                          >
                            마트
                          </button>
                          <button
                            onClick={() => {
                              if (!virtualInteracted) setStage2Tab('friend');
                            }}
                            className={`py-1.5 px-1 rounded-lg text-[9px] font-bold border transition-all text-center cursor-pointer ${getTabHighlight('friend')}`}
                          >
                            친구에게
                          </button>
                          <button
                            onClick={() => {
                              if (!virtualInteracted) setStage2Tab('teacher');
                            }}
                            className={`py-1.5 px-1 rounded-lg text-[9px] font-bold border transition-all text-center cursor-pointer ${getTabHighlight('teacher')}`}
                          >
                            선생님께(국고)
                          </button>
                        </div>

                        <div className="space-y-2 pt-1">
                          {stage2Tab === 'mart' && (
                            <div>
                              <span className="text-[9px] text-gray-400 font-bold block">🛒 결제 가맹점</span>
                              <div className="px-3 py-1.5 bg-gray-50 border border-slate-200 rounded-lg font-black text-[10px] text-slate-800">
                                클래스 마트 (전자 화폐 가맹점)
                              </div>
                            </div>
                          )}
                          {stage2Tab === 'friend' && (
                            <div>
                              <span className="text-[9px] text-gray-400 font-bold block">👤 받는 친구 계좌 / 이름</span>
                              <div className="px-3 py-1.5 bg-gray-50 border border-slate-200 rounded-lg font-black text-[10px] text-slate-800">
                                [클래스뱅크 123-555-8888] 김민우
                              </div>
                            </div>
                          )}
                          {stage2Tab === 'teacher' && (
                            <div>
                              <span className="text-[9px] text-gray-400 font-bold block">🏛️ 납부처</span>
                              <div className="px-3 py-1.5 bg-gray-50 border border-slate-200 rounded-lg font-black text-[10px] text-slate-800">
                                담임 선생님 (국고 계좌)
                              </div>
                            </div>
                          )}

                          <div>
                            <span className="text-[9px] text-gray-400 font-bold block">💰 보낼 머니 설정</span>
                            <div className="px-3 py-1.5 bg-gray-50 border border-slate-200 rounded-lg font-black text-[10px] flex justify-between text-slate-800">
                              <span>1,000</span>
                              <span className="text-gray-500">원</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => {
                              if (gamePhase === 'battle' && isCorrectTabSelected) {
                                handleVirtualInteract();
                              }
                            }}
                            disabled={gamePhase === 'battle' && !isCorrectTabSelected}
                            className={`w-full py-2.5 rounded-lg font-black text-xs transition-all cursor-pointer ${
                              gamePhase === 'battle'
                                ? isCorrectTabSelected
                                  ? getBattleHighlightClass(true)
                                  : 'bg-slate-100 border border-slate-300 text-slate-400 cursor-not-allowed opacity-60'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-700'
                            }`}
                          >
                            {gamePhase === 'battle' 
                              ? (virtualInteracted 
                                  ? '✅ 송금 완료!' 
                                  : isCorrectTabSelected
                                    ? '👉 송금하기 (클릭!)'
                                    : stage2Tab === 'friend'
                                      ? '⚠️ 마트 탭을 먼저 선택하세요'
                                      : '⚠️ 친구에게 탭을 먼저 선택하세요') 
                              : '송금하기'}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {currentStage === 3 && (() => {
                    const activeMonster = monsters.find(m => m.id === activeMonsterIdx);
                    const activeConceptIdx = activeMonster?.conceptIdx ?? 0;

                    return (
                      <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
                        {/* Tabs: "주식 시작" and "내 주식" */}
                        <div className="flex border-b border-gray-200">
                          <button
                            onClick={() => {
                              if (gamePhase !== 'battle') setStage3Tab('start');
                            }}
                            className={`flex-1 pb-1.5 text-[10px] font-black transition-all border-b-2 text-center cursor-pointer ${
                              stage3Tab === 'start'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            주식 시작
                          </button>
                          <button
                            onClick={() => {
                              if (gamePhase !== 'battle') setStage3Tab('mine');
                            }}
                            className={`flex-1 pb-1.5 text-[10px] font-black transition-all border-b-2 text-center cursor-pointer ${
                              stage3Tab === 'mine'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            내 주식
                          </button>
                        </div>

                        {stage3Tab === 'mine' ? (
                          <div className="p-4 text-center text-[10px] font-bold text-gray-400 space-y-1">
                            <div>📦 보유 중인 주식이 없습니다.</div>
                            <div className="text-[8px] text-gray-300">"주식 시작" 탭에서 건전한 기업에 투자해 보세요!</div>
                          </div>
                        ) : stage3TimerActive ? (
                          /* 10 Minute Timer Screen */
                          <div className="bg-sky-50 border-2 border-sky-200 p-4 rounded-xl text-center space-y-3">
                            <span className="text-xl block animate-pulse">⏳</span>
                            <div>
                              <span className="text-[9px] text-sky-800 font-extrabold bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-full">
                                10분 락 타임 안전장치 가동 중
                              </span>
                              <h4 className="font-mono text-xl font-black text-slate-800 mt-2">10:00</h4>
                            </div>
                            <p className="text-[8.5px] text-slate-500 leading-normal font-semibold">
                              과도한 투기를 예방하기 위한 클래스뱅크의 안전 규칙이에요. 잠시 후 신중하게 다시 거래해 주세요!
                            </p>
                            <span className="text-[8.5px] text-emerald-600 font-bold block">
                              ✅ 안전장치가 정상 동작하여 암기 공격이 가능해요!
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Stock Item Box (Light blue background, black text) */}
                            <div 
                              onClick={() => {
                                if (gamePhase === 'battle') {
                                  if (activeConceptIdx === 0 && !virtualInteracted) {
                                    handleVirtualInteract();
                                  } else if (activeConceptIdx === 1 && stage3Step === 'none') {
                                    setStage3Step('clicked_stock');
                                  }
                                }
                              }}
                              className={`p-3 rounded-xl border transition-all text-left space-y-1 ${
                                gamePhase === 'battle' && activeConceptIdx === 0 && !virtualInteracted
                                  ? 'bg-amber-100 border-2 border-amber-400 animate-pulse cursor-pointer'
                                  : gamePhase === 'battle' && activeConceptIdx === 1 && stage3Step === 'none'
                                  ? 'bg-amber-100 border-2 border-amber-400 animate-pulse cursor-pointer'
                                  : selectedStockIdx !== null || stage3Step !== 'none'
                                  ? 'bg-sky-100 border-2 border-sky-400 text-black'
                                  : 'bg-sky-50 hover:bg-sky-100/70 border border-sky-200 text-black cursor-pointer'
                              }`}
                            >
                              <div className="flex justify-between items-center text-[10px] font-bold">
                                <span>삼성전자 (나노반도체)</span>
                                <span className="text-red-600 font-black">120원 (▲ 20)</span>
                              </div>
                              {gamePhase === 'battle' && (
                                <div className="text-[8px] font-black mt-1">
                                  {activeConceptIdx === 0 && !virtualInteracted && (
                                    <span className="text-amber-800">👉 첫 단계: 여기에 마우스를 클릭해 주세요!</span>
                                  )}
                                  {activeConceptIdx === 0 && virtualInteracted && (
                                    <span className="text-emerald-600">✅ 항목 클릭 완료! (암기 공격을 하세요!)</span>
                                  )}
                                  {activeConceptIdx === 1 && stage3Step === 'none' && (
                                    <span className="text-amber-800">👉 단계 1: 먼저 주식 항목을 클릭해 주세요!</span>
                                  )}
                                  {activeConceptIdx === 1 && stage3Step !== 'none' && (
                                    <span className="text-emerald-600">✅ 주식 항목 선택 완료</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Buy/Sell Buttons - Hidden during activeConceptIdx === 0 battle */}
                            {!(gamePhase === 'battle' && activeConceptIdx === 0) && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    if (gamePhase === 'battle') {
                                      if (activeConceptIdx === 1 && stage3Step === 'clicked_stock') {
                                        setStage3Step('clicked_buy');
                                      } else if (activeConceptIdx === 2) {
                                        setStage3TimerActive(true);
                                        handleVirtualInteract();
                                      }
                                    }
                                  }}
                                  disabled={
                                    gamePhase === 'battle' && 
                                    (activeConceptIdx === 1 ? stage3Step !== 'clicked_stock' : false)
                                  }
                                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                                    gamePhase === 'battle' && activeConceptIdx === 1 && stage3Step === 'clicked_stock'
                                      ? 'bg-amber-400 text-black border-2 border-amber-500 animate-pulse'
                                      : gamePhase === 'battle' && activeConceptIdx === 2
                                      ? 'bg-amber-400 text-black border-2 border-amber-500 animate-pulse'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                                  }`}
                                >
                                  {gamePhase === 'battle' && activeConceptIdx === 1 && stage3Step === 'clicked_stock'
                                    ? '👉 매수 (클릭!)'
                                    : gamePhase === 'battle' && activeConceptIdx === 2
                                    ? '👉 매수 (클릭!)'
                                    : '매수'}
                                </button>
                                <button 
                                  onClick={() => {
                                    if (gamePhase === 'battle' && activeConceptIdx === 1 && stage3Step === 'clicked_buy') {
                                      setStage3Step('clicked_sell');
                                      handleVirtualInteract();
                                    }
                                  }}
                                  disabled={
                                    gamePhase === 'battle' && 
                                    (activeConceptIdx === 1 ? stage3Step !== 'clicked_buy' : true)
                                  }
                                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                                    gamePhase === 'battle' && activeConceptIdx === 1 && stage3Step === 'clicked_buy'
                                      ? 'bg-amber-400 text-black border-2 border-amber-500 animate-pulse'
                                      : 'bg-red-500 hover:bg-red-600 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                                  }`}
                                >
                                  {gamePhase === 'battle' && activeConceptIdx === 1 && stage3Step === 'clicked_buy'
                                    ? '👉 매도 (클릭!)'
                                    : '매도'}
                                </button>
                              </div>
                            )}

                            {/* Help Badge for Battles */}
                            {gamePhase === 'battle' && activeConceptIdx === 1 && (
                              <div className="text-[8px] bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-slate-500 font-bold leading-normal text-left">
                                {stage3Step === 'none' && '순서: [1] 주식 항목 클릭 ➔ [2] 매수 클릭 ➔ [3] 매도 클릭'}
                                {stage3Step === 'clicked_stock' && '순서: [1] 완료 ➔ [2] 활성화된 매수 클릭 ➔ [3] 매도 클릭'}
                                {stage3Step === 'clicked_buy' && '순서: [1] 완료 ➔ [2] 완료 ➔ [3] 활성화된 매도 클릭'}
                                {stage3Step === 'clicked_sell' && '🎉 거래 미션 모두 완료! 왼쪽 공격 버튼을 누르세요!'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {currentStage === 4 && (() => {
                    const activeMonster = monsters.find(m => m.id === activeMonsterIdx);
                    const activeConceptIdx = activeMonster?.conceptIdx ?? 0;

                    const isInteractable = gamePhase === 'battle' && !virtualInteracted;

                    return (
                      <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
                        <span className="font-black text-xs text-gray-800 block pb-1 border-b border-gray-200">🤝 진행 중인 펀드</span>
                        
                        {/* Fund container area as a single interactive clickable item */}
                        <div 
                          onClick={() => {
                            if (isInteractable) {
                              if (activeConceptIdx === 2) {
                                setStage4Success(true);
                              }
                              handleVirtualInteract();
                            }
                          }}
                          className={`p-3.5 border rounded-xl space-y-2.5 text-left transition-all ${
                            isInteractable
                              ? 'bg-amber-50 border-2 border-amber-400 shadow-md animate-pulse cursor-pointer'
                              : 'bg-indigo-50/50 border border-indigo-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-black text-[10px] text-indigo-950">지각생 제로 펀드</span>
                            {stage4Success ? (
                              <span className="text-[8.5px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded">성공</span>
                            ) : (
                              <span className="text-[8.5px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded">운영 중</span>
                            )}
                          </div>

                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-2 transition-all duration-500 ${stage4Success ? 'bg-emerald-500 w-full' : 'bg-indigo-600 w-[95%]'}`} 
                            />
                          </div>

                          {stage4Success ? (
                            <div className="space-y-1 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                              <span className="font-black text-[9.5px] text-emerald-800 block">🎉 펀드 목표 달성 성공!</span>
                              <div className="flex justify-between text-[8px] text-emerald-700 font-extrabold">
                                <span>보상: +1,000원</span>
                                <span>인센티브: +1,000원</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between text-[9px] text-gray-500 font-semibold">
                              <span>모집율 95%</span>
                              <span>목표배당 150%</span>
                            </div>
                          )}

                          {isInteractable && (
                            <div className="text-[8.5px] text-center font-black text-amber-800 block">
                              👉여기를 마우스로 클릭해 주세요!
                            </div>
                          )}
                        </div>

                        {/* Standard button modified */}
                        <button 
                          disabled={isInteractable}
                          onClick={() => {
                            if (gamePhase === 'battle') {
                              if (activeConceptIdx === 2) {
                                setStage4Success(true);
                              }
                              handleVirtualInteract();
                            }
                          }}
                          className={`w-full py-2 font-black text-[10px] rounded-lg transition-all ${
                            isInteractable
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-slate-200'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 cursor-pointer'
                          }`}
                        >
                          {virtualInteracted ? '✅ 펀드 가입 완료!' : '펀드 가입하기'}
                        </button>
                      </div>
                    );
                  })()}

                  {currentStage === 5 && (() => {
                    const activeMonster = monsters.find(m => m.id === activeMonsterIdx);
                    const activeConceptIdx = activeMonster?.conceptIdx ?? 0;

                    return (
                      <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
                        <span className="font-black text-xs text-gray-800 block pb-1 border-b border-gray-200">🏦 추천 예금 상품</span>
                        <div className="space-y-2">
                          {/* 1. 다람쥐 예금 */}
                          <div 
                            onClick={() => {
                              if (gamePhase === 'battle' && activeConceptIdx === 0) {
                                handleVirtualInteract();
                              }
                            }}
                            className={`p-2.5 border rounded-xl flex justify-between items-center transition-all ${
                              gamePhase === 'battle' && activeConceptIdx === 0
                                ? getBattleHighlightClass(true) + ' cursor-pointer'
                                : 'border-2 border-emerald-200 bg-emerald-50/50'
                            }`}
                          >
                            <div className="text-left">
                              <span className="text-[10px] font-black text-gray-800 block">
                                {gamePhase === 'battle' && activeConceptIdx === 0
                                  ? (virtualInteracted ? '✅ 가입 완료!' : '🏦 다람쥐 예금 (클릭!)')
                                  : '다람쥐 예금'}
                              </span>
                              
                              {/* Interest Rate */}
                              {gamePhase === 'battle' && activeConceptIdx === 2 ? (
                                <span 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVirtualInteract();
                                  }}
                                  className={`text-[9px] font-black px-1.5 py-0.5 rounded block w-fit transition-all cursor-pointer ${
                                    getBattleHighlightClass(true)
                                  }`}
                                >
                                  {virtualInteracted ? '✅ 금리 10%' : '👉 금리 10% (클릭!)'}
                                </span>
                              ) : (
                                <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">
                                  금리 10%
                                </span>
                              )}
                            </div>

                            {/* Subscription Period */}
                            <div className="text-right">
                              {gamePhase === 'battle' && activeConceptIdx === 1 ? (
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVirtualInteract();
                                  }}
                                  className={`p-1.5 rounded transition-all cursor-pointer ${
                                    getBattleHighlightClass(true)
                                  }`}
                                >
                                  <span className="text-[9px] font-black block">
                                    {virtualInteracted ? '✅ 가입 기간: 7일' : '👉 가입 기간: 7일 (클릭!)'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-500 font-black">
                                  가입 기간: 7일
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 2. 도토리 예금 (Disabled/Dashed/Opacity block) */}
                          <div className="p-2 border-2 border-dashed border-gray-200 rounded-xl flex justify-between items-center opacity-60">
                            <div className="text-left">
                              <span className="text-[10px] font-black text-gray-800 block">도토리 예금</span>
                              <span className="text-[9px] text-gray-500 font-bold block mt-0.5">금리 25%</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-black">가입 기간: 14일</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {currentStage === 6 && (() => {
                    const activeMonster = monsters.find(m => m.id === activeMonsterIdx);
                    const activeConceptIdx = activeMonster?.conceptIdx ?? 0;

                    return (
                      <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
                        <span className="font-black text-xs text-gray-800 block pb-1 border-b border-gray-200">⌨️ 경제 콘텐츠 리스트</span>
                        <div className="grid grid-cols-2 gap-2 text-left">
                          {/* 1. 경제상식 (Top Left) - Active when activeConceptIdx === 2 */}
                          <div 
                            onClick={() => {
                              if (gamePhase === 'battle' && activeConceptIdx === 2) {
                                handleVirtualInteract();
                              }
                            }}
                            className={`p-2.5 border rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[64px] ${
                              gamePhase === 'battle' && activeConceptIdx === 2
                                ? getBattleHighlightClass(true)
                                : 'bg-amber-50 border-2 border-amber-200 hover:bg-amber-100/60'
                            }`}
                          >
                            <span className="text-sm block">📚</span>
                            <span className="text-[8px] font-black text-amber-700 block mt-1">
                              {gamePhase === 'battle' && activeConceptIdx === 2
                                ? (virtualInteracted ? '✅ 완료!' : '📚 경제상식 (클릭!)') 
                                : '경제상식'}
                            </span>
                          </div>

                          {/* 2. 경제자판 (Top Right) - Active when activeConceptIdx === 3 */}
                          <div 
                            onClick={() => {
                              if (gamePhase === 'battle' && activeConceptIdx === 3) {
                                handleVirtualInteract();
                              }
                            }}
                            className={`p-2.5 border rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[64px] ${
                              gamePhase === 'battle' && activeConceptIdx === 3
                                ? getBattleHighlightClass(true)
                                : 'bg-indigo-50 border-2 border-indigo-200 hover:bg-indigo-100/60'
                            }`}
                          >
                            <span className="text-sm block">⌨️</span>
                            <span className="text-[8px] font-black text-indigo-700 block mt-1">
                              {gamePhase === 'battle' && activeConceptIdx === 3
                                ? (virtualInteracted ? '✅ 완료!' : '⌨️ 경제자판 (클릭!)') 
                                : '경제자판'}
                            </span>
                          </div>

                          {/* 3. 기부왕 (Bottom Left) - Active when activeConceptIdx === 0 */}
                          <div 
                            onClick={() => {
                              if (gamePhase === 'battle' && activeConceptIdx === 0) {
                                handleVirtualInteract();
                              }
                            }}
                            className={`p-2.5 border rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[64px] ${
                              gamePhase === 'battle' && activeConceptIdx === 0
                                ? getBattleHighlightClass(true)
                                : 'bg-pink-50 border-2 border-pink-200 hover:bg-pink-100/60'
                            }`}
                          >
                            <span className="text-sm block">👑</span>
                            <span className="text-[8px] font-black text-pink-700 block mt-1">
                              {gamePhase === 'battle' && activeConceptIdx === 0
                                ? (virtualInteracted ? '✅ 완료!' : '👑 기부왕 (클릭!)') 
                                : '기부왕'}
                            </span>
                          </div>

                          {/* 4. 경제뉴스 (Bottom Right) - Active when activeConceptIdx === 1 */}
                          <div 
                            onClick={() => {
                              if (gamePhase === 'battle' && activeConceptIdx === 1) {
                                handleVirtualInteract();
                              }
                            }}
                            className={`p-2.5 border rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[64px] ${
                              gamePhase === 'battle' && activeConceptIdx === 1
                                ? getBattleHighlightClass(true)
                                : 'bg-sky-50 border-2 border-sky-200 hover:bg-sky-100/60'
                            }`}
                          >
                            <span className="text-sm block">📰</span>
                            <span className="text-[8px] font-black text-sky-700 block mt-1">
                              {gamePhase === 'battle' && activeConceptIdx === 1
                                ? (virtualInteracted ? '✅ 완료!' : '📰 경제뉴스 (클릭!)') 
                                : '경제뉴스'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* High fidelity inline interactive quiz swapped with Chest Discovery & Unlock block */}
                  {gamePhase === 'chest_quest' ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-3 rounded-xl border-2 border-indigo-400 shadow-sm space-y-2 text-center"
                    >
                      <div className="text-3xl animate-pulse">🎁✨</div>
                      <div>
                        <span className="text-[8px] text-amber-700 font-bold bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-full uppercase">상자 발견!</span>
                        <h4 className="font-black text-gray-900 text-[10px] mt-1">[{currentConfig.item}] 획득 관문</h4>
                      </div>
                      
                      {quizAnswer === currentConfig.quizzes[completedQuizCount]?.correctIndex ? (
                        <div className="space-y-1.5 pt-0.5">
                          <div className="bg-emerald-50 text-emerald-800 p-1.5 rounded-lg border border-emerald-200 text-center text-[9px] font-black animate-bounce">
                            🎉 퀴즈를 맞췄어요! 잠금이 해제되었습니다!
                          </div>
                          {completedQuizCount < currentConfig.quizzes.length - 1 ? (
                            <button
                              onClick={handleNextQuiz}
                              className="w-full py-1.5 bg-gradient-to-r from-indigo-500 to-sky-600 hover:from-indigo-600 hover:to-sky-700 text-white font-black text-[10px] rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1"
                            >
                              <span>다음 퀴즈 풀기 ➔</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const updatedCleared = { ...stageCleared, [currentStage]: true };
                                setStageCleared(updatedCleared);
                                saveProgress(currentStage, updatedCleared);
                                setGamePhase('stage_clear');
                              }}
                              className="w-full py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-[10px] rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1"
                            >
                              <span>🎁 보물 상자 열기 ➔</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-center space-y-0.5">
                          <span className="text-[9px] text-slate-400 font-bold block">🔒 상자 잠김</span>
                          <p className="text-[8.5px] text-slate-500 leading-normal font-semibold">
                            왼쪽 메인화면에 있는 <strong className="text-indigo-600">배움 확인 퀴즈</strong>의 정답을 골라 맞춰 상자의 잠금을 해제해 주세요! 🗝️
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="bg-slate-100/50 border border-dashed border-slate-300 p-3 rounded-xl text-center space-y-0.5">
                      <span className="text-sm block">🔒</span>
                      <span className="text-[9px] text-slate-400 font-bold block">퀴즈 관문 잠김</span>
                      <p className="text-[8.5px] text-slate-400 leading-normal font-semibold">
                        지도의 모든 몬스터를 무찌르고 보물상자(🔑)에 도착하면 배움 확인 퀴즈가 활성화됩니다!
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-indigo-50 border-2 border-indigo-300 p-4 rounded-2xl text-xs space-y-1.5 mt-4">
                  <span className="font-black text-indigo-950">💡 초등 눈높이 도움말</span>
                  <p className="text-[10px] text-indigo-700 leading-relaxed font-semibold">
                    이 화면은 클래스뱅크의 실제 사용 화면을 가상으로 재현한 것이에요. 가이드를 마치고 실제 페이지로 가셔서 동일한 카드를 찾아 마음껏 경제활동을 펼쳐 보세요!
                  </p>
                </div>
              </div>
            ) : (
              // Stage 7: The Royal Certificate (이수증) fully centered and gorgeous
              <div className="flex-1 bg-gradient-to-tr from-amber-50/50 via-white to-orange-50/40 p-6 md:p-12 flex flex-col items-center justify-between overflow-y-auto">
                <div className="max-w-xl w-full text-center space-y-6">
                  {/* Explosion of confetti - custom styled in container */}
                  <motion.div 
                    ref={certificateRef}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="relative bg-white border-[14px] border-double border-[#D4AF37] p-8 md:p-12 rounded-[24px] shadow-xl print-certificate-container"
                  >
                    {/* Corner golden ornaments */}
                    <div className="absolute top-2 left-2 text-xl text-[#D4AF37] no-print">⚜️</div>
                    <div className="absolute top-2 right-2 text-xl text-[#D4AF37] no-print">⚜️</div>
                    <div className="absolute bottom-2 left-2 text-xl text-[#D4AF37] no-print">⚜️</div>
                    <div className="absolute bottom-2 right-2 text-xl text-[#D4AF37] no-print">⚜️</div>

                    <div className="print-border-frame">
                      <div className="text-center space-y-6">
                        <span className="text-4xl block">🎓</span>
                        
                        <div>
                          <h2 className="font-black text-3xl md:text-4xl text-gray-900 tracking-tight font-serif text-[#D4AF37]">
                            경제 시민 이수증
                          </h2>
                          <p className="text-xs text-gray-400 font-bold mt-1">CLASSBANK FINANCIAL CITIZENSHIP</p>
                        </div>

                        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent w-40 mx-auto" />

                        <div className="space-y-6 text-sm font-bold text-gray-700 leading-relaxed max-w-md mx-auto">
                          <p className="font-black text-lg md:text-xl text-gray-900">성명: {userName}</p>
                          <p className="text-sm md:text-base font-extrabold text-gray-800 leading-loose">
                            위 학생은 학급 경영 경제 플랫폼 '클래스뱅크'가 주관하는<br />
                            6단계 경제 원정대 가이드를 우수한 성적으로 수료하고<br />
                            올바른 자산 운용 및 상생 경제 수칙을<br />
                            완벽하게 터득하였기에 이 이수증을 수여합니다.
                          </p>
                        </div>

                        <div className="pt-6 space-y-1.5 text-xs md:text-sm text-gray-500 font-bold">
                          <p>발행처: 클래스뱅크 교육 위원회</p>
                          <p className="font-mono">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>

                        {/* Gold Badge Seal */}
                        <div className="pt-4 flex justify-center">
                          <div className="w-14 h-14 rounded-full bg-[#D4AF37] border-4 border-amber-200 flex items-center justify-center text-white text-xs font-black shadow-md relative">
                            <span className="transform -rotate-12">PASS</span>
                            <div className="absolute -bottom-2 w-2 h-6 bg-[#D4AF37] transform rotate-45 rounded-sm"></div>
                            <div className="absolute -bottom-2 w-2 h-6 bg-[#D4AF37] transform -rotate-45 rounded-sm"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center no-print pt-4">
                    <button
                      onClick={handleSaveImage}
                      className="px-6 py-3 bg-[#D4AF37] hover:bg-[#bfa032] text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      💾 이미지 저장
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
