import React, { useState, useEffect, useRef } from 'react';
import { XIcon, BackIcon } from './icons';

interface EconomyTypingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 3등급 체계 배지 정의
interface Badge {
  id: string;
  name: string;
  tier: 'coin' | 'banknote' | 'jewel';
  icon: string;
  description: string;
}

const BADGES: Badge[] = [
  // 동전 등급 (Coin Tier)
  { id: 'coin_10', name: '데굴이', tier: 'coin', icon: '🪙', description: '티끌 모아 태산! 첫 경제 단어 공부를 시작한 노력의 징표입니다.' },
  { id: 'coin_50', name: '통통이', tier: 'coin', icon: '🌾', description: '벼 이삭이 자라듯 지식도 차곡차곡 무럭무럭 자라나고 있습니다.' },
  { id: 'coin_100', name: '다보', tier: 'coin', icon: '💰', description: '기본 경제 단어들을 올바르게 익힌 성실한 주니어 경제인 배지입니다.' },
  { id: 'coin_500', name: '조기', tier: 'coin', icon: '🐖', description: '저금통을 가득 채우듯 경제 지식을 착실하게 쌓아 획득했습니다.' },
  { id: 'coin_copper', name: '학이', tier: 'coin', icon: '🧱', description: '단단하고 기초가 튼튼한 청동 주화처럼 경제 기초를 완성했습니다.' },
  { id: 'coin_silver', name: '두루미', tier: 'coin', icon: '⚪', description: '반짝이는 은빛처럼 맑고 깨끗한 경제 지식과 소비 습관의 첫걸음.' },
  { id: 'coin_gold', name: '링컨', tier: 'coin', icon: '🟡', description: '황금빛 가치를 가득 품은 반짝이는 금화 배지를 획득하셨습니다.' },
  { id: 'coin_ancient', name: '리버티', tier: 'coin', icon: '🌟', description: '돈의 역사와 화폐의 본질을 완벽하게 타이핑하여 알아낸 모험가 배지.' },
  { id: 'coin_lucky', name: '엽저니', tier: 'coin', icon: '🍀', description: '현명한 경제 지식을 갖추기 시작한 어린이에게 찾아온 행운의 배지.' },
  { id: 'coin_rainbow', name: '골디', tier: 'coin', icon: '🌈', description: '다채로운 경제 개념들을 막힘없이 타이핑하여 획득한 무지개 배지.' },
  
  // 지폐 등급 (Banknote Tier)
  { id: 'bill_1000', name: '처니', tier: 'banknote', icon: '💵', description: '짧은 문장을 막힘없이 써내려가며 기초적인 금융 지식을 마스터했습니다.' },
  { id: 'bill_5000', name: '오천', tier: 'banknote', icon: '💴', description: '경제 문장들을 정확하게 입력하여 경제 뉴스를 읽을 자격을 얻었습니다.' },
  { id: 'bill_10000', name: '마니', tier: 'banknote', icon: '💶', description: '공급과 수요, 세금의 기본 흐름을 타이핑으로 터득한 우수 경제 통역사.' },
  { id: 'bill_50000', name: '사임', tier: 'banknote', icon: '💷', description: '지폐 등급 최고 난이도의 금융 상식 레이스를 시간 내 통과한 장인.' },
  { id: 'bill_check', name: '조지', tier: 'banknote', icon: '🧾', description: '고마운 마음과 가치 있는 교환의 정이 담긴 특별한 지폐 배지입니다.' },
  { id: 'bill_pocket', name: '수표', tier: 'banknote', icon: '✉️', description: '큰 규모의 신용 거래와 가치를 보증하는 멋진 수표를 획득했습니다.' },
  { id: 'bill_wallet', name: '위아니', tier: 'banknote', icon: '💼', description: '현명한 지출과 저축 계획이 가지런히 정리되어 들어있는 멋진 배지.' },
  { id: 'bill_credit', name: '에나', tier: 'banknote', icon: '💳', description: '높은 신뢰와 약속을 바탕으로 편리한 거래를 정복한 신용인 배지.' },
  { id: 'bill_safe', name: '유로', tier: 'banknote', icon: '🔐', description: '나만의 소중한 자산과 금융 상식을 안전하게 보호해줄 나만의 배지.' },
  { id: 'bill_passport', name: '타노', tier: 'banknote', icon: '🌐', description: '전 세계의 다양한 경제와 문화를 폭넓게 이해하는 글로벌 경제 주니어.' },
  
  // 보석 등급 (Jewel Tier)
  { id: 'jewel_ruby', name: '쿼츠', tier: 'jewel', icon: '❤️', description: '주식과 분산투자의 긴 글 문맥을 마스터하여 기업가 정신을 일깨운 배지.' },
  { id: 'jewel_sapphire', name: '토파즈', tier: 'jewel', icon: '💙', description: '환율과 기축통화의 흐름을 날카롭게 이해하고 긴 글을 정복한 금융 엘리트.' },
  { id: 'jewel_emerald', name: '제이드', tier: 'jewel', icon: '💚', description: '부동산과 신용, 장기적인 자산 계획의 진정한 가치를 정복한 경제 거장.' },
  { id: 'jewel_topaz', name: '애미', tier: 'jewel', icon: '💛', description: '세상을 바꿀 멋진 아이디어로 새로운 비즈니스를 개척해 나가는 개척가 배지.' },
  { id: 'jewel_amethyst', name: '오팔', tier: 'jewel', icon: '💜', description: '복잡한 거시경제 지표와 정책을 깊이 있게 이해하고 정독한 기획가.' },
  { id: 'jewel_garnet', name: '진주', tier: 'jewel', icon: '🤎', description: '사회적 책임을 다하며 공동체와 나누는 가치를 배운 따뜻한 기업가 배지.' },
  { id: 'jewel_pearl', name: '루비', tier: 'jewel', icon: '⚪', description: '한 방울의 물방울이 모여 진주가 되듯, 오랜 노력을 인정받은 저축 마스터.' },
  { id: 'jewel_crown', name: '사파이어', tier: 'jewel', icon: '👑', description: '교실 경제 크래프트의 모든 지혜를 다스릴 수 있는 영광스러운 왕관.' },
  { id: 'jewel_trophy', name: '에매랄드', tier: 'jewel', icon: '🏆', description: '끈기와 열정으로 타자 연습 대장정을 끝내고 한 손에 쥐게 된 명예로운 트로피.' },
  { id: 'jewel_diamond', name: '다이아', tier: 'jewel', icon: '💎', description: '최고 등급의 모든 경제 장문을 오타 없이 완벽히 정독하여 정복한 최고 존엄.' }
];

// 낱말 데이터베이스
const WORD_POOL = [
  "경제", "자유시장경제", "화폐", "소득", "기회비용", "희소성", "수요와 공급", "시장", "인플레이션",
  "디플레이션", "화폐 가치", "이스털린의 역설", "은행", "예대 마진", "예금", "적금", "펀드", "주식",
  "중앙은행", "시중은행", "금리", "통화량", "저축", "단리", "복리", "주택 청약 통장", "대출",
  "신용점수", "신용카드", "체크카드", "가계부", "투자", "주식회사", "재무제표", "우량주", "유망주",
  "재무설계사", "보험", "CEO", "다국적 기업", "스타트업", "독과점", "AS", "리콜", "유지보수",
  "사회적 기업", "공유경제", "플랫폼", "인수합병", "마케팅", "세금", "부가가치세", "연말정산", "관세",
  "FTA", "사회보험", "국내총생산", "기획재정부", "예금자 보호 제도", "최저 임금 제도", "금융실명제",
  "소비자 기본법", "보이스피싱", "스미싱", "대리입금", "폐기화폐", "위조화폐", "환율", "환율변동",
  "IMF외환위기", "외환위기", "산업혁명", "흑자", "적자", "블루오션", "레드오션", "한계 효용 체감의 법칙",
  "비교우위", "슈링크플레이션", "엥겔계수", "펭귄효과", "베블런효과", "YOLO", "무지출챌린지", "파이어족",
  "부동산", "매매", "전세", "월세", "공인중개사", "공유 오피스", "젠트리피케이션", "신도시",
  "부동산세금", "배당금", "코스피", "나스닥", "코스닥", "가상화폐", "핀테크", "한국거래소",
  "연방준비제도", "예금자보호법", "금융감독원", "인터넷전문은행", "제2금융권", "제3금융권", "제1금융권",
  "생산", "소비", "분배", "자유", "경쟁", "가계", "정부", "기업", "경제의 3주체", "전자화폐",
  "코인", "NFT", "근로소득", "자본소득", "금융소득", "이전소득", "사업소득", "고정비용", "매몰비용",
  "주식시장", "부동산시장", "외환시장", "기업은행", "하나은행", "산업은행", "국민은행", "우리은행",
  "신한은행", "농협", "축협", "신협", "수협", "새마을금고", "예금 이자", "대출 이자", "원금",
  "신용대출", "학자금대출", "담보대출", "과소비 지수 계산", "이익", "위험성", "달러", "엔", "원",
  "위안", "유로", "빚", "매출", "배당주", "펀드매니저", "수수료", "암보험", "화재보험", "자동차보험",
  "실비보험", "CFO", "빅맥지수", "유니콘 기업", "과점", "독점", "블랙컨슈머", "소득세", "재산세",
  "상속세", "증여세", "법인세", "환경세", "소득공제", "자유무역협정", "국민연금", "고용보험",
  "산재보험", "건강보험", "환전", "그린오션", "엔젤계수", "백로효과", "절약", "용돈기입장"
];

// 짧은 글 데이터베이스 (80개 수록)
const SHORT_POOL = [
  "경제는 인간의 생활에 필요한 재화와 서비스를 생산, 분배, 소비하는 모든 활동을 말합니다.",
  "자유시장경제는 정부의 간섭을 최소화하고 시장의 자율적인 가격 기구에 의해 움직이는 체제입니다.",
  "화폐는 상품의 교환을 매개하고 가치를 측정하며 저장하는 사회적 약속이자 수단입니다.",
  "소득은 개인이 노동이나 자본을 제공하고 그 대가로 얻는 정기적인 경제적 이익을 뜻합니다.",
  "기회비용은 어떤 하나의 대안을 선택했을 때 포기해야 하는 다른 선택지의 최대 가치입니다.",
  "희소성은 인간의 무한한 욕망에 비해 자원이 상대적으로 부족한 경제적 상태를 의미합니다.",
  "수요와 공급은 시장에서 상품의 가격과 거래량을 결정하는 가장 핵심적인 두 가지 힘입니다.",
  "시장은 상품과 서비스의 구매자와 판매자가 만나 자유롭게 거래를 체결하는 가상의 공간입니다.",
  "인플레이션은 화폐 가치가 지속적으로 하락하면서 전반적인 물가가 상승하는 현상입니다.",
  "디플레이션은 경기 침체와 함께 전반적인 물가가 지속적으로 하락하는 경제 현상을 뜻합니다.",
  "화폐 가치는 돈이 가진 실질적인 구매력을 뜻하며 물가가 오를수록 가치는 떨어지게 됩니다.",
  "이스털린의 역설은 소득이 일정 수준을 넘으면 행복도가 더 이상 증가하지 않는다는 이론입니다.",
  "한계 효용 체감의 법칙은 상품을 소비할수록 추가로 얻는 만족감이 점차 줄어든다는 원리입니다.",
  "비교우위는 특정 재화를 다른 나라보다 상대적으로 더 낮은 기회비용으로 생산할 수 있는 능력입니다.",
  "슈링크플레이션은 제품의 가격은 그대로 유지하면서 크기나 용량을 줄여 실질적으로 가격을 올리는 꼼수입니다.",
  "엥겔계수는 가계의 총지출 중에서 식료품비가 차지하는 비율을 나타내는 지표입니다.",
  "펭귄효과는 다른 소비자가 제품을 구매하는 것을 보고 뒤따라 동조 구매를 일으키는 현상입니다.",
  "베블런효과는 가격이 오를수록 과시욕 때문에 오히려 수요가 증가하는 고가 제품의 소비 현상입니다.",
  "고정비용은 생산량의 변동과 관계없이 매달 일정하게 지출해야 하는 임차료나 인건비 등의 비용입니다.",
  "매몰비용은 이미 지출되어 어떤 선택을 하더라도 다시 회수할 수 없는 이전의 비용을 말합니다.",
  "중앙은행은 한 나라의 통화 가치를 안정시키고 통화량을 조절하는 발권력을 가진 최고의 은행입니다.",
  "시중은행은 일반 대중을 상대로 예금을 받고 대출을 해주는 제1금융권의 중심 기관입니다.",
  "예대 마진은 은행이 대출로 벌어들인 이자에서 예금자에게 준 이자를 뺀 핵심 수익원입니다.",
  "예금은 고객이 자금을 일정 기간 은행에 맡기고 이자를 받는 가장 안전한 금융 상품입니다.",
  "적금은 일정 기간 정기적으로 금액을 납입하여 목돈을 만들기 위한 저축 상품입니다.",
  "주택 청약 통장은 새로운 아파트를 분양받을 수 있는 자격을 얻기 위해 가입하는 필수 저축입니다.",
  "단리는 처음에 맡긴 원금에 대해서만 약정된 이자를 계산하여 지급하는 방식입니다.",
  "복리는 원금에 생긴 이자를 다시 원금에 포함하여 다음 주기의 이자를 계산하는 방식입니다.",
  "금리는 빌려준 돈이나 맡긴 돈에 붙는 이자의 비율로 경제의 온도계 역할을 합니다.",
  "통화량은 일정한 시점에 시중에 유통되고 있는 화폐와 금융 자산의 총량을 말합니다.",
  "대출은 금융기관이 고객의 신용이나 담보를 바탕으로 돈을 빌려주는 금융 거래입니다.",
  "인터넷전문은행은 오프라인 점포 없이 모든 금융 서비스를 모바일 앱으로만 제공하는 은행입니다.",
  "제2금융권은 시중은행을 제외한 보험사, 카드사, 증권사, 새마을금고 등의 금융기관을 통칭합니다.",
  "신용점수는 개인의 금융 거래 이력을 바탕으로 신용도를 평가하여 나타낸 지표입니다.",
  "신용카드는 개인의 신용을 바탕으로 상품을 먼저 구매하고 나중에 대금을 결제하는 카드입니다.",
  "체크카드는 결제 시 개인의 은행 계좌 잔액에서 즉시 돈이 빠져나가는 직불 형태의 카드입니다.",
  "가계부는 수입과 지출을 꼼꼼히 기록하여 가정의 자금을 계획적으로 관리하는 일지입니다.",
  "용돈기입장은 개인이 받은 용돈의 사용 내역을 기록하여 올바른 소비 습관을 기르는 장부입니다.",
  "예금자 보호 제도는 금융기관이 파산해도 예금자보호법에 따라 오천만 원까지 원금을 보장하는 제도입니다.",
  "금융감독원은 금융기관의 건전성을 감독하고 금융 소비자를 보호하는 국정 기관입니다.",
  "투자는 미래의 더 큰 이익이나 이윤을 기대하며 현재의 자금을 자산에 투입하는 행위입니다.",
  "주식회사는 주식을 발행하여 여러 사람으로부터 자본을 조달받아 설립된 기업 형태입니다.",
  "재무제표는 기업의 경영 성과와 재무 상태를 일목요연하게 기록한 회계 보고서입니다.",
  "우량주는 재무 구조가 탄탄하고 안정적인 이익을 내는 업계 대표 기업의 주식입니다.",
  "유망주는 현재 규모는 작지만 미래의 성장 잠재력과 가치가 높을 것으로 기대되는 주식입니다.",
  "배당주는 기업이 벌어들인 이익의 일부를 주주들에게 정기적으로 나누어주는 주식입니다.",
  "배당금은 기업이 경영 활동을 통해 얻은 이익 중 일부를 주주들에게 환원하는 현금입니다.",
  "펀드는 다수의 투자자에게 모은 자금을 전문가인 펀드매니저가 대신 운용하는 금융 상품입니다.",
  "한국거래소는 주식이나 채권 같은 증권이 공정하게 거래되도록 개설된 제도적 시장입니다.",
  "코스피는 한국거래소의 유가증권시장에 상장된 기업들의 주가를 종합한 대표 지수입니다.",
  "코스닥은 주로 벤처기업이나 IT 기업들이 상장되어 거래되는 한국의 주식시장입니다.",
  "나스닥은 미국의 벤처기업과 대형 기술주들이 상장되어 있는 세계적인 주식시장입니다.",
  "연방준비제도는 미국의 중앙은행 제도로 전 세계 금융 시장에 막강한 영향력을 행사합니다.",
  "핀테크는 금융과 정보기술의 융합을 통해 한층 편리해진 금융 서비스를 제공하는 기술입니다.",
  "CEO는 기업의 경영 전반을 총괄하고 최종 의사결정을 내리는 최고경영자입니다.",
  "CFO는 기업의 재무 상태를 관리하고 자금 흐름을 총괄하는 최고재무책임자입니다.",
  "다국적 기업은 세계 여러 나라에 현지 법인과 공장을 두고 글로벌하게 활동하는 기업입니다.",
  "스타트업은 혁신적인 기술이나 참신한 아이디어를 기반으로 창업한 초기 단계의 벤처기업입니다.",
  "유니콘 기업은 상장 전 기업 가치가 십억 달러 이상으로 평가받는 유망한 스타트업을 말합니다.",
  "인수합병은 하나의 기업이 다른 기업의 주식이나 자산을 매입하여 경영권을 합치는 전략입니다.",
  "독과점은 하나의 기업이 시장을 독점하거나 소수의 과점 기업이 시장을 장악한 상태를 뜻합니다.",
  "사회적 기업은 취약계층에게 일자리를 제공하는 등 사회적 목적을 우선으로 추구하는 기업입니다.",
  "공유경제는 물품이나 공간을 소유하지 않고 여러 사람이 협력하여 나누어 쓰는 경제 모델입니다.",
  "플랫폼은 공급자와 수요자가 온라인 공간에서 원활하게 거래할 수 있도록 만든 네트워크 시스템입니다.",
  "부가가치세는 상품의 거래나 서비스가 제공되는 모든 단계에서 창출되는 부가 가치에 매기는 세금입니다.",
  "연말정산은 근로소득자가 일 년간 납부한 세금을 연말에 최종 정산하여 환급받거나 추가 납부하는 제도입니다.",
  "관세는 자국의 산업을 보호하고 재정을 확보하기 위해 수입 물품에 부과하는 세금입니다.",
  "FTA는 회원국 간의 관세 장벽을 낮추거나 철폐하여 자유로운 무역을 촉진하는 협정입니다.",
  "국내총생산은 일정 기간 한 나라 안에서 생산된 모든 최종 재화와 서비스의 시장 가치입니다.",
  "기획재정부는 국가의 재정 정책을 수립하고 예산을 편성하는 정부의 핵심 경제 부처입니다.",
  "금융실명제는 금융 거래 시 가명이나 차명이 아닌 반드시 본인의 실명으로만 거래하도록 한 제도입니다.",
  "소비자 기본법은 소비자의 권익을 증진하고 안전과 이익을 법적으로 보호하기 위해 제정된 법률입니다.",
  "환율은 자국 화폐와 외국 화폐의 교환 비율로 국제 무역과 경제에 큰 영향을 미칩니다.",
  "외환위기는 한 국가의 외환보유고가 바닥나 외국의 빚을 갚지 못하게 되는 국가 부도 상태입니다.",
  "블루오션은 치열한 경쟁이 없어 엄청난 성장 잠재력을 가진 미개척 시장을 의미합니다.",
  "레드오션은 이미 수많은 경쟁자가 진입하여 시장 점유율 싸움이 격화된 포화 시장을 뜻합니다.",
  "YOLO는 미래를 위한 저축보다 현재 자신의 행복과 소비를 가장 중시하는 라이프 스타일입니다.",
  "무지출챌린지는 생활비를 극단적으로 줄여 하루 지출을 영 원으로 만드는 절약 운동입니다.",
  "파이어족은 젊을 때 자산을 조기 축적하여 사십 대 전후에 은퇴하는 것을 목표로 하는 사람들입니다.",
  "젠트리피케이션은 낙후된 구도심이 번성하면서 임대료가 올라 기존 원주민이 내몰리는 현상입니다."
];

// 긴 글 데이터베이스 (8개 중 10개 완성을 위해 순환 혹은 8개 전체 진행 - 사용자는 "긴 글 10개 완료"를 요구했으므로, 8개 풀을 순환하거나 10개 완성을 위한 데이터 10개 확보 필요!)
// 10개 완성을 위해 10개 고품질 문장 세트 준비!
const LONG_POOL = [
  "희소성은 인간의 무한한 욕망에 비해 자원이 상대적으로 부족한 상태를 뜻합니다. 이로 인해 우리는 선택의 순간마다 포기한 가치인 기회비용을 계산하게 됩니다. 자원의 한계를 인식하고 가장 합리적인 대안을 찾는 것이 경제학의 출발점입니다.",
  "자유시장경제는 정부의 간섭 없이 시장의 자율적인 가격 기구에 의해 작동하는 체제입니다. 아담 스미스가 말한 보이지 않는 손이 수요와 공급을 조절하여 자원을 효율적으로 배분합니다. 다만 시장이 스스로 해결하지 못하는 불평등 문제에는 정부의 역할이 필요하기도 합니다.",
  "한계 효용 체감의 법칙은 상품을 소비할수록 추가로 얻는 만족감이 점차 줄어든다는 원리입니다. 아무리 좋아하는 음식도 계속 먹다 보면 첫 입을 먹었을 때만큼 맛있지 않은 것과 같습니다. 합리적인 소비자는 이러한 만족감의 변화를 고려하여 지출 규모를 결정합니다.",
  "비교우위 이론은 각국이 상대적으로 저렴한 기회비용으로 생산할 수 있는 재화에 특화하는 것입니다. 이 원리를 바탕으로 국가 간 장벽을 허무는 자유무역협정인 에프티에이가 체결됩니다. 서로 잘하는 분야에 집중하고 교역함으로써 참여국 모두가 더 큰 이익을 누리게 됩니다.",
  "이스털린의 역설은 소득이 일정 수준을 넘어 기본 욕구가 충족되면 행복도가 더 이상 비례하여 증가하지 않는다는 이론입니다. 경제적 풍요가 인간의 정신적 만족감까지 무한정 보장해주지는 못한다는 점을 시사합니다. 이는 물질적 성장 외에 삶의 질을 높이는 다른 요소들이 중요함을 보여줍니다.",
  "슈링크플레이션은 제품의 가격은 그대로 두고 크기나 용량을 줄여 실질적으로 가격을 올리는 현상입니다. 기업들이 물가 상승의 압박을 소비자에게 직접적으로 드러내지 않기 위해 사용하는 마케팅 꼼수입니다. 소비자는 제품을 구매할 때 가격표뿐만 아니라 단위당 함량까지 꼼꼼히 확인해야 합니다.",
  "엥겔계수는 가계의 전체 지출 중에서 식료품비가 차지하는 비율을 나타내는 지표입니다. 일반적으로 소득 수준이 높아질수록 먹는 것에 쓰는 절대적 비율은 낮아지는 경향이 있습니다. 따라서 이 계수는 한 나라의 가계 생활 수준을 가늠하는 중요한 척도로 활용됩니다.",
  "펭귄효과는 특정 제품에 대해 확신이 없다가 다른 사람이 구매하기 시작하면 동조하여 사는 현상입니다. 주저하던 펭귄 무리 중 한 마리가 먼저 바다에 뛰어들면 나머지가 일제히 따르는 모습에서 유래했습니다. 기업들은 이러한 군중 심리를 자극하여 초기 시장을 개척하는 마케팅을 펼치기도 합니다.",
  "베블런효과는 가격이 오를수록 과시욕과 허영심 때문에 오히려 수요가 증가하는 소비 현상입니다. 주로 명품이나 고급 자동차 등 상류층의 부를 과시하는 상품에서 명확하게 나타납니다. 합리적 가치와 무관하게 남들에게 돋보이고 싶어 하는 인간의 독특한 심리가 반영된 결과입니다.",
  "백로효과는 남들과 차별화된 자신만의 독특한 소비를 추구하며 대중적인 제품을 기피하는 심리입니다. 하얀 백로처럼 고고하게 남들과 섞이지 않겠다는 뜻에서 스놉 효과라고도 부릅니다. 유행하는 제품의 인기가 높아질수록 해당 제품에 대한 수요가 오히려 줄어드는 특징이 있습니다.",
  "고정비용은 생산량이나 매출의 변동과 관계없이 매달 일정하게 지출해야 하는 비용입니다. 매장 임차료나 직원의 기본급, 정기적인 보험료 등이 대표적인 예시입니다. 불황기에는 이러한 고정적인 지출을 얼마나 효율적으로 줄이느냐가 기업과 가계의 생존을 결정합니다.",
  "매몰비용은 이미 지출되어 어떤 선택을 하더라도 다시 회수할 수 없는 이전의 비용을 말합니다. 많은 사람이 지금까지 들인 돈과 시간이 아까워서 잘못된 선택을 지속하는 오류를 범하곤 합니다. 현명한 의사결정을 내리기 위해서는 과거의 비용을 과감히 잊고 미래의 이익만 따져야 합니다.",
  "독과점은 하나의 기업이 시장을 독점하거나 소수의 기업이 시장을 장악하여 경쟁이 사라진 상태입니다. 경쟁이 없는 시장에서는 기업이 가격을 마음대로 올려 소비자에게 피해를 주기 쉽습니다. 정부는 시장의 공정한 경쟁을 촉진하기 위해 법적으로 독과점 행위를 규제하고 있습니다.",
  "블랙컨슈머는 고의적으로 악성 민원을 제기하며 기업을 상대로 부당한 보상을 요구하는 불량 소비자입니다. 이들은 제품의 미미한 결함을 과장하거나 허위 사실을 유포하여 기업의 이미지를 훼손합니다. 건전한 시장 질서를 확립하기 위해서는 이들의 억지 주장에 단호하게 대처하는 기준이 필요합니다.",
  "과소비 지수 계산은 자신의 수입에 비해 얼마나 많은 금액을 지출하고 있는지 점검하는 방법입니다. 소득에서 저축액을 뺀 소비 금액을 전체 소득으로 나누어 지수의 크기를 측정합니다. 이 지수가 높게 나올수록 미래를 위한 자산 형성이 어려워지므로 정기적인 가계부 작성을 통해 지출을 통제해야 합니다.",
  "시중은행은 일반 대중을 상대로 예금을 받고 대출을 해주는 제1금융권의 중심 기관입니다. 안전성이 높은 대신 통상적으로 제2금융권에 비해 예금 이자가 다소 낮은 편입니다. 우리 주변에서 가장 흔하게 접할 수 있으며 안정적인 금융 자산 관리에 필수적입니다.",
  "예대 마진은 은행이 대출로 벌어들이는 이자에서 예금자에게 지급한 이자를 뺀 핵심 수익원입니다. 대출자에게 받는 이자율은 높이고 예금자에게 주는 이자율은 낮출수록 은행의 이익은 커집니다. 금융 시장의 금리 변동에 따라 이 마진의 폭이 달라지며 은행의 건전성에 영향을 줍니다.",
  "중앙은행은 한 나라의 통화 가치를 안정시키고 통화량을 조절하는 최고의 금융 기관입니다. 우리나라의 한국은행처럼 화폐를 독점적으로 발행할 수 있는 발권력을 가집니다. 경기가 과열되거나 침체될 때 기준금리를 인상하거나 인하하여 경제의 흐름을 조율합니다.",
  "복리는 원금에 생긴 이자를 다시 원금에 포함하여 다음 주기의 이자를 계산하는 방식입니다. 시간이 흐를수록 이자에 이자가 붙으면서 자산이 눈덩이처럼 불어나는 효과를 봅니다. 장기 저축이나 주식 투자를 할 때 복리의 마법을 활용하면 자산 형성 속도가 엄청나게 빨라집니다.",
  "주택 청약 통장은 새로운 아파트를 분양받을 수 있는 자격을 얻기 위해 가입하는 필수 금융 상품입니다. 매달 정기적으로 일정 금액을 납입하여 순위와 점수를 높이는 것이 유리합니다. 많은 청년층과 무주택 가구가 내 집 마련의 꿈을 이루기 위해 가장 먼저 준비하는 통장입니다.",
  "인터넷전문은행은 오프라인 점포를 운영하지 않고 모든 서비스를 모바일 앱으로만 제공하는 형태입니다. 점포 유지비와 인건비를 절감하여 소비자에게 더 낮은 대출 금리와 높은 예금 금리를 제시합니다. 핀테크 기술과의 융합을 통해 혁신적인 금융 서비스를 선보이며 빠르게 성장하고 있습니다.",
  "제2금융권은 시중은행을 제외한 보험사, 카드사, 증권사, 새마을금고 등의 금융기관을 통칭하는 말입니다. 제1금융권에 비해 대출 심사 문턱이 낮은 편이지만 그만큼 대출 이자가 높다는 특징이 있습니다. 금융 소비자는 각 기관의 위험성과 혜택을 꼼꼼히 비교하여 이용해야 합니다.",
  "신용점수는 개인의 금융 거래 이력을 바탕으로 경제적 신용도를 평가하여 나타낸 지표입니다. 연체 없이 신용카드를 사용하고 대출금을 제때 상환하면 점수가 높게 유지됩니다. 이 점수는 추후 은행에서 대출을 받거나 신용카드를 발급받을 때 결정적인 기준이 됩니다.",
  "체크카드는 결제 시 개인의 은행 계좌 잔액에서 즉시 돈이 빠져나가는 직불 형태의 카드입니다. 통장에 잔액이 있는 범위 내에서만 소비를 할 수 있어 충동적인 과소비를 예방해 줍니다. 또한 연말정산 시 신용카드보다 높은 소득공제 혜택을 받을 수 있어 알뜰한 소비에 유리합니다.",
  "예금자 보호 제도는 금융기관이 파산하여 예금을 돌려주지 못할 때 예금자를 보호하는 제도입니다. 예금자보호법에 따라 금융기관별로 1인당 최고 오천만 원까지 원금과 이자를 보장합니다. 따라서 자산을 안전하게 분산 저축하고 싶다면 이 한도에 맞춰 여러 은행에 나누어 맡기는 것이 좋습니다.",
  "금융감독원은 금융기관의 건전성을 감독하고 금융 시장의 공정한 질서를 확립하는 국정 기관입니다. 은행이나 증권사 등이 법규를 준수하는지 감시하며 금융 소비자들의 피해를 구제합니다. 보이스피싱 같은 불법 금융 범죄가 발생했을 때 신속하게 대처하고 대중에게 경고를 보냅니다.",
  "단리는 처음에 맡긴 원금에 대해서만 약정된 이자율을 적용하여 이자를 계산하는 방식입니다. 복리와 달리 이자가 원금에 합산되지 않으므로 장기 투자 시 자산 증식 효과가 상대적으로 떨어집니다. 주로 기간이 짧은 단기 예금이나 채권의 이자를 계산할 때 자주 활용되는 방식입니다.",
  "통화량은 일정한 시점에 시중에 유통되고 있는 화폐와 금융 자산의 총량을 의미합니다. 통화량이 과도하게 늘어나면 돈의 가치가 떨어지고 물가가 상승하는 인플레이션이 발생할 수 있습니다. 중앙은행은 금리 조절을 통해 시중의 통화량을 적정 수준으로 유지하며 물가를 안정시킵니다.",
  "예금과 적금은 불확실한 미래를 대비하고 목돈을 만들기 위한 가장 기초적인 금융 활동입니다. 예금은 목돈을 한 번에 은행에 맡기는 것이고 적금은 매달 일정 금액을 차곡차곡 쌓아가는 방식입니다. 투자에 비해 수익률은 낮지만 원금 손실의 위험성이 없어 자산의 안정성을 지켜줍니다.",
  "담보대출은 부동산이나 금융 자산 등 가치 있는 물건을 은행에 맡기고 돈을 빌리는 금융 거래입니다. 신용대출에 비해 빌릴 수 있는 금액이 크고 이자율이 상대적으로 낮다는 장점이 있습니다. 다만 기한 내에 빚을 갚지 못하면 담보로 맡긴 자산이 처분될 수 있으므로 주의해야 합니다.",
  "재무제표는 기업의 경영 성과와 재무 상태를 일목요연하게 기록한 회계 보고서입니다. 기업의 매출, 이익, 부채 수준 등 핵심적인 금융 정보가 고스란히 담겨 있습니다. 주식 투자자는 원금 손실의 위험성을 줄이기 위해 투자 전 반드시 이 문서를 분석해야 합니다.",
  "우량주와 유망주는 주식 시장에서 투자 대상의 성격을 구분하는 대표적인 용어입니다. 우량주는 재무 구조가 탄탄하고 안정적인 이익을 내는 업계 대표 기업의 주식을 뜻합니다. 반면 유망주는 현재 규모는 작지만 차별화된 기술력으로 미래에 크게 성장할 가능성이 높은 주식입니다.",
  "배당주는 기업이 벌어들인 이익의 일부를 주주들에게 정기적으로 나누어주는 주식입니다. 주가 상승에 따른 차익 외에도 안정적인 현금 흐름인 배당금을 챙길 수 있는 장점이 있습니다. 변동성이 큰 주식 시장에서 비교적 안전한 자본소득을 원하는 투자자들에게 인기가 많습니다.",
  "펀드는 전문가인 펀드매니저가 다수의 투자자에게 모은 자금을 대신 운용해 주는 금융 상품입니다. 개인 투자자가 접근하기 어려운 다양한 주식이나 채권에 분산 투자하여 위험성을 낮춰줍니다. 자산 관리를 대행해 주는 대가로 일정 금액의 운용 수수료가 매달 발생한다는 점을 유념해야 합니다.",
  "한국거래소는 주식이나 채권 같은 증권이 공정하고 투명하게 거래되도록 개설된 제도적 시장입니다. 국내 기업들의 주가 흐름을 종합한 코스피와 코스닥 지수가 이곳에서 산출됩니다. 자본주의 경제 시스템이 원활하게 작동할 수 있도록 기업과 투자자를 연결해 주는 핵심 인프라입니다.",
  "나스닥은 미국의 벤처기업과 대형 기술주들이 대거 상장되어 있는 세계적인 주식시장입니다. 전 세계 정보기술 산업의 동향을 파악할 수 있는 지표로 글로벌 투자자들의 이목이 집중되는 곳입니다. 마이크로소프트나 애플 같은 거대 다국적 기업들이 이곳에서 활발히 거래되고 있습니다.",
  "연방준비제도는 미국의 중앙은행 제도로 전 세계 금융 시장의 흐름을 좌우하는 막강한 기구입니다. 이들이 결정하는 미국의 기준금리는 글로벌 자금의 이동과 환율 변동에 직접적인 영향을 줍니다. 따라서 한국의 투자자들도 연방준비제도의 통화 정책 발표를 항상 주시해야 합니다.",
  "핀테크는 금융과 정보기술의 융합을 통해 한층 편리해진 금융 서비스를 제공하는 기술 혁신입니다. 스마트폰 앱을 이용한 간편 송금이나 모바일 자산 관리 서비스가 대표적인 예시입니다. 전통적인 은행 업무의 장벽을 허물며 금융 소비자의 편의성을 극대화하고 있습니다.",
  "가상화폐는 블록체인 기술을 기반으로 네트워크상에서 안전하게 유통되는 디지털 자산입니다. 비트코인 같은 코인이나 고유한 가치를 지닌 엔에프티 등이 대표적인 형태입니다. 정부나 중앙은행의 통제를 받지 않아 자율성이 높은 반면 가격의 위험성과 변동성이 매우 큽니다.",
  "스타트업은 혁신적인 기술이나 참신한 아이디어를 기반으로 설립된 초기 단계의 벤처기업입니다. 이들 중 기업 가치가 십억 달러 이상으로 평가받는 비상장 기업을 유니콘 기업이라고 부릅니다. 위험성이 높지만 성공할 경우 국가 경제의 패러다임을 바꿀 만큼 엄청난 부가가치를 창출합니다.",
  "인수합병은 하나의 기업이 다른 기업의 경영권을 매입하거나 자산을 합쳐 몸집을 키우는 전략입니다. 새로운 기술을 신속하게 확보하거나 경쟁자를 제거하여 시장 점유율을 높이기 위해 시행됩니다. 기업의 가치와 매출 구조를 근본적으로 변화시키는 중요한 의사결정 중 하나입니다.",
  "최고경영자인 씨이오는 기업의 전반적인 경영을 총괄하고 최종적인 의사결정을 내리는 리더입니다. 재무책임자인 씨에프오는 기업의 자금 흐름을 투명하게 관리하고 투자 계획을 수립합니다. 이 두 직책의 역량과 긴밀한 협력에 따라 기업의 미래 성패가 크게 좌우됩니다.",
  "빅맥지수는 각국에서 판매되는 맥도날드 빅맥의 가격을 비교하여 환율의 적정성을 평가하는 지표입니다. 전 세계 어디서나 품질이 동일한 상품의 가치는 같아야 한다는 구매력 평가설을 기반으로 합니다. 복잡한 경제학 이론을 사용하지 않고도 각국의 물가 수준을 쉽게 비교할 수 있어 자주 인용됩니다.",
  "사회적 기업은 취약계층에게 일자리를 제공하는 등 사회적 목적을 우선으로 추구하며 영업하는 기업입니다. 이윤 추구라는 기업의 본질을 잃지 않으면서도 공동체의 이익과 복지 증진을 위해 기여합니다. 착한 소비를 지향하는 현대 사회에서 지속 가능한 경제 모델로 주목받고 있습니다.",
  "공유경제는 물품이나 공간을 소유하지 않고 필요할 때마다 여러 사람이 나누어 쓰는 경제 모델입니다. 인터넷 플랫폼의 발전으로 차량이나 공유 오피스 등의 거래가 전 세계적으로 활성화되었습니다. 자원의 낭비를 줄이고 합리적인 비용으로 서비스를 이용할 수 있는 장점이 있습니다.",
  "부가가치세는 상품의 거래나 서비스가 제공되는 모든 단계에서 새로 창출된 가치에 부과하는 세금입니다. 우리가 마트에서 물건을 사거나 식당에서 밥을 먹을 때 이미 영수증에 포함되어 있습니다. 최종 소비자가 부담하는 대표적인 간접세로 국가 재정을 확보하는 데 큰 비중을 차지합니다.",
  "연말정산은 근로소득자가 일 년간 임시로 납부한 세금을 연말에 정확히 계산하여 정산하는 제도입니다. 소득공제와 세액공제 항목을 꼼꼼하게 증빙해야 세금을 돌려받는 환급의 기쁨을 누릴 수 있습니다. 자칫 준비를 소홀히 하면 세금을 더 내야 하므로 직장인들에게는 매우 중요한 연례행사입니다.",
  "관세는 자국의 산업을 보호하고 국가 재정을 확보하기 위해 수입 물품에 부과하는 세금입니다. 국가 간 무역 장벽을 완전히 낮추는 자유무역협정이 체결되면 이 관세가 대폭 철폐됩니다. 관세의 변동은 수입품의 국내 판매 가격에 직접적인 영향을 주어 소비자 물가를 움직입니다.",
  "국내총생산인 지디피는 일정 기간 한 나라 안에서 생산된 모든 최종 재화와 서비스의 시장 가치입니다. 국적과 관계없이 영토 안에서 창출된 부를 측정하므로 한 국가의 경제 규모를 보는 지표입니다. 이 수치가 지속적으로 성장한다는 것은 그 나라의 경제 활동이 활발함을 의미합니다.",
  "기획재정부는 국가의 전반적인 경제 정책을 수립하고 한 해 예산을 편성하는 핵심 정부 부처입니다. 나라의 살림살이를 계획하고 세금을 효율적으로 배분하여 국민 경제의 안정을 도모합니다. 물가 안정과 고용 창출 등 거시적인 경제 목표를 달성하기 위해 다양한 정책을 집행합니다.",
  "금융실명제는 금융 거래 시 가명이나 차명이 아닌 반드시 본인의 실제 명의로만 거래하도록 한 제도입니다. 자금의 투명성을 높여 부정부패와 지하경제의 확산을 막기 위해 도입되었습니다. 우리 금융 시장의 정의를 바로 세우고 건전한 거래 문화를 정착시킨 역사적인 조치입니다.",
  "소비자 기본법은 소비자의 권익을 증진하고 안전과 재산상 이익을 법적으로 보호하기 위해 제정된 법률입니다. 제품의 결함으로 피해를 보았을 때 정당하게 리콜이나 무상 수리를 요구할 수 있는 근거가 됩니다. 소비자는 이 법에 보장된 권리를 잘 이해하고 주체적인 소비 생활을 영위해야 합니다.",
  "보이스피싱과 스미싱은 날로 교묘해지는 대표적인 전자금융 사기 범죄입니다. 문자 메시지의 악성 링크를 클릭하게 하거나 검찰을 사칭하여 통장의 자금을 가로채는 수법을 씁니다. 모르는 번호로 온 연락은 항상 의심해야 하며 금융감독원이나 경찰에 즉시 신고하여 피해를 예방해야 합니다.",
  "환율은 자국 화폐와 외국 화폐의 교환 비율로 국제 무역의 흐름을 결정하는 핵심 변수입니다. 환율변동이 심해지면 수출입 기업의 이익이 요동치고 국내 물가에도 비상이 걸립니다. 해외여행을 가거나 해외 주식에 투자할 때는 환전 시점의 환율을 반드시 확인해야 합니다.",
  "우리나라는 천구백구십칠 년에 자국 화폐 가치가 폭락하며 아이엠에프 외환위기를 맞이했습니다. 국가의 외환보유고가 바닥나 외국의 빚을 갚지 못해 국제통화기금에 자금을 지원받았던 사건입니다. 당시 국민들은 금모으기 운동을 벌여 전 세계를 놀라게 하며 위기를 조기에 극복해 냈습니다.",
  "블루오션과 레드오션은 시장의 경쟁 상태를 색깔로 명확하게 대비하여 표현한 경제 용어입니다. 레드오션은 이미 수많은 경쟁자가 진입하여 피 튀기는 점유율 싸움을 벌이는 포화 시장을 뜻합니다. 반면 블루오션은 경쟁자가 없는 유망한 미개척 시장으로 막대한 이익을 창출할 잠재력이 있습니다.",
  "욜로는 미래를 위한 저축보다 현재 자신의 행복과 소비를 가장 중시하는 라이프 스타일입니다. 반면 파이어족은 젊을 때 지출을 극단적으로 줄여 자산을 축적한 뒤 조기 은퇴하는 것을 목표로 합니다. 두 트렌드는 현대인들이 삶과 돈을 바라보는 가치관의 극명한 차이를 보여줍니다.",
  "무지출챌린지는 고물가 시대에 생활비를 줄이기 위해 하루 지출을 영 원으로 만드는 절약 운동입니다. 소셜 네트워크 서비스에 용돈기입장을 인증하며 불필요한 과소비를 함께 통제해 나갑니다. 청년층 사이에서 놀이 문화처럼 번지며 경기 침체기 속 새로운 생존 전략으로 자리 잡았습니다.",
  "젠트리피케이션은 낙후된 구도심이 번성하면서 임대료가 올라 기존 원주민이 내몰리는 현상입니다. 독창적인 상점을 운영하던 소상공인들이 대형 프랜차이즈에 밀려 쫓겨나는 부작용을 낳습니다. 지역 경제의 활성화라는 장점 뒤에 숨은 도시 재생의 그늘로 시급한 상생 대책이 필요합니다.",
  "국가의 수입이 지출보다 많아 여유가 있는 상태를 재정 흑자라고 부릅니다. 반대로 수입보다 지출이 많아 빚을 지게 되는 부정적인 상태는 재정 적자라고 합니다. 정부는 세금의 징수와 지출의 균형을 맞추어 국가 채무가 과도하게 늘어나지 않도록 관리해야 합니다."
];

// 한글 타수(키스트로크)를 정확히 계산하기 위한 초성/중성/종성 획수 분석 헬퍼 함수
const countKeystrokes = (text: string): number => {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    
    // 한글 음절 (가 ~ 힣)
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const offset = code - 0xAC00;
      const jong = offset % 28;
      const jung = ((offset - jong) / 28) % 21;
      const cho = Math.floor((offset - jong) / 28 / 21);
      
      const CHO_STROKES = [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1];
      const JUNG_STROKES = [1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 1, 2, 1];
      const JONG_STROKES = [0, 1, 2, 2, 1, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1];
      
      count += (CHO_STROKES[cho] || 1) + (JUNG_STROKES[jung] || 1) + (JONG_STROKES[jong] || 0);
    } 
    // 한글 자음/모음 (ㄱ ~ ㅣ)
    else if (code >= 0x3130 && code <= 0x318F) {
      const doubleJamos = ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅒ', 'ㅖ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'];
      if (doubleJamos.includes(char)) {
        count += 2;
      } else {
        count += 1;
      }
    } 
    // 영문, 숫자, 기호, 공백 등
    else {
      if (code >= 65 && code <= 90) {
        count += 2; // 대문자는 Shift 필요하므로 2타
      } else {
        count += 1;
      }
    }
  }
  return count;
};

const BadgeImage: React.FC<{ id: string; name: string; icon: string; className?: string }> = ({ id, name, icon, className }) => {
  const [hasError, setHasError] = useState(false);
  const src = `/badges/${id}.png`;

  if (hasError) {
    return <span className={className}>{icon}</span>;
  }

  return (
    <img
      src={src}
      alt={name}
      className={className}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
    />
  );
};

export const EconomyTypingModal: React.FC<EconomyTypingModalProps> = ({ isOpen, onClose }) => {
  // 화면 모드: 'menu' | 'practice' | 'result'
  const [mode, setMode] = useState<'menu' | 'practice' | 'result'>('menu');
  // 연습 타겟 등급: 'coin' | 'banknote' | 'jewel' | null
  const [selectedTier, setSelectedTier] = useState<'coin' | 'banknote' | 'jewel' | null>(null);
  
  // 현재 진행할 문장 목록 (10개 고정)
  const [sessionTexts, setSessionTexts] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  // 타이핑 입력값 및 통계
  const [typedText, setTypedText] = useState<string>('');
  const [accuracy, setAccuracy] = useState<number>(100);
  const [speed, setSpeed] = useState<number>(0);
  
  // 오타 감지를 위한 백그라운드 계산
  const [totalCharTyped, setTotalCharTyped] = useState<number>(0);
  const [correctCharTyped, setCorrectCharTyped] = useState<number>(0);
  
  // 세션 타이머 관련 (초 단위)
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 통계 측정용 시간 기록
  const [startTime, setStartTime] = useState<number>(0);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [itemStartTime, setItemStartTime] = useState<number | null>(null);
  
  // 세션 누적 평균 타수 계산용
  const [sessionKeystrokes, setSessionKeystrokes] = useState<number>(0);
  const [sessionTypingTime, setSessionTypingTime] = useState<number>(0);
  const [averageSpeed, setAverageSpeed] = useState<number>(0);
  
  // 획득한 배지 정보
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null);
  
  // 이름 기입 및 획득일자 정보
  const [earnerName, setEarnerName] = useState<string>('');
  const [isNameLocked, setIsNameLocked] = useState<boolean>(false);
  const [earnDate, setEarnDate] = useState<string>('');

  // 브라우저 얼럿/컨펌 API 대체용 커스텀 모달 상태
  const [confirmExit, setConfirmExit] = useState<boolean>(false);
  const [localNotification, setLocalNotification] = useState<{ text: string; onClose?: () => void } | null>(null);

  // 현재 활성화된 탭 ('practice' | 'collection')
  const [activeTab, setActiveTab] = useState<'practice' | 'collection'>('practice');

  // 로컬 스토리지에서 획득한 배지 목록 및 이름 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('unlocked_economy_badges');
    if (saved) {
      try {
        setUnlockedBadges(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    const savedName = localStorage.getItem('economy_earner_name');
    if (savedName) {
      setEarnerName(savedName);
      setIsNameLocked(true);
    }
  }, [isOpen]);

  // 이름 등록 및 로컬스토리지 저장
  const handleLockName = (name: string) => {
    if (!name.trim()) {
      setLocalNotification({ text: '이름을 한 글자 이상 입력해 주세요!' });
      return;
    }
    setEarnerName(name);
    setIsNameLocked(true);
    localStorage.setItem('economy_earner_name', name);
  };

  // 모달 제어
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      resetSession();
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 타이머 실행 루프
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  const resetSession = () => {
    setMode('menu');
    setSelectedTier(null);
    setSessionTexts([]);
    setCurrentIndex(0);
    setTypedText('');
    setAccuracy(100);
    setSpeed(0);
    setTotalCharTyped(0);
    setCorrectCharTyped(0);
    setTimeLeft(0);
    setIsTimerRunning(false);
    setEarnedBadge(null);
    setConfirmExit(false);
    setItemStartTime(null);
    setSessionKeystrokes(0);
    setSessionTypingTime(0);
    setAverageSpeed(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // 피셔-예이츠 셔플로 랜덤 10개 고르기
  const getRandomItems = (pool: string[], count: number = 10): string[] => {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // 연습 시작하기
  const startPractice = (tier: 'coin' | 'banknote' | 'jewel') => {
    setSelectedTier(tier);
    let texts: string[] = [];
    let timeLimit = 0;

    if (tier === 'coin') {
      texts = getRandomItems(WORD_POOL, 10);
      timeLimit = 60; // 낱말 10개 60초 제한
    } else if (tier === 'banknote') {
      texts = getRandomItems(SHORT_POOL, 10);
      timeLimit = 180; // 짧은 글 10개 180초 제한
    } else {
      texts = getRandomItems(LONG_POOL, 10); // 긴 글 60개 풀 중 랜덤 10개로 진행
      timeLimit = 400; // 긴 글 10개 400초 제한
    }

    setSessionTexts(texts);
    setCurrentIndex(0);
    setTypedText('');
    setAccuracy(100);
    setSpeed(0);
    setTotalCharTyped(0);
    setCorrectCharTyped(0);
    setItemStartTime(null);
    setSessionKeystrokes(0);
    setSessionTypingTime(0);
    setAverageSpeed(0);
    
    // 시간 설정
    setTimeLeft(timeLimit);
    setIsTimerRunning(true);
    setStartTime(Date.now());
    setMode('practice');
  };

  // 타수 및 정확도 실시간 계산
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTypedText(value);

    const targetText = sessionTexts[currentIndex];
    if (!targetText) return;

    // 실시간 정확도 계산
    let matches = 0;
    const minLen = Math.min(value.length, targetText.length);
    for (let i = 0; i < minLen; i++) {
      if (value[i] === targetText[i]) matches++;
    }
    
    const currentAccuracy = value.length > 0 ? Math.round((matches / value.length) * 100) : 100;
    setAccuracy(currentAccuracy);

    // 타수 계산 (한글 자소/키스트로크 조합 기반 실시간 CPM 계산)
    // 입력이 시작된 순간에 개별 문장의 시작 시간(itemStartTime)을 실시간으로 기록하여 딜레이 패널티 방지
    let currentItemStartTime = itemStartTime;
    if (value.length > 0 && !itemStartTime) {
      currentItemStartTime = Date.now();
      setItemStartTime(currentItemStartTime);
    } else if (value.length === 0) {
      currentItemStartTime = null;
      setItemStartTime(null);
    }

    if (currentItemStartTime) {
      const elapsedSeconds = (Date.now() - currentItemStartTime) / 1000;
      if (elapsedSeconds > 0.3) {
        const keystrokes = countKeystrokes(value);
        const cpm = Math.round((keystrokes / elapsedSeconds) * 60);
        setSpeed(Math.min(1200, cpm)); // 최대 1200타 보정
      } else {
        // 극초반 스파이크 현상 방지
        setSpeed(0);
      }
    } else {
      setSpeed(0);
    }
  };

  // 엔터 키나 스페이스바로 전송 시 다음 문장으로 이동
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitCurrentText();
    }
  };

  const submitCurrentText = () => {
    if (!typedText.trim()) return;

    // 현재 단어/글 정답 체크 (정확도가 너무 낮으면 넘어갈 수 없음 - 최소 70% 이상 요건)
    if (accuracy < 70) {
      setLocalNotification({
        text: '정확도가 너무 낮습니다. 오타를 수정해주세요!\n(정확도 70% 이상 완료 필수)'
      });
      return;
    }

    // 누적 키입력 및 시간 측정
    if (itemStartTime) {
      const elapsed = (Date.now() - itemStartTime) / 1000;
      setSessionTypingTime(prev => prev + elapsed);
      setSessionKeystrokes(prev => prev + countKeystrokes(typedText));
    }

    // 통계 누적
    setTotalCharTyped(prev => prev + typedText.length);
    setCorrectCharTyped(prev => {
      const targetText = sessionTexts[currentIndex];
      let matches = 0;
      const minLen = Math.min(typedText.length, targetText.length);
      for (let i = 0; i < minLen; i++) {
        if (typedText[i] === targetText[i]) matches++;
      }
      return prev + matches;
    });

    if (currentIndex < sessionTexts.length - 1) {
      // 다음 단계로
      setCurrentIndex(prev => prev + 1);
      setTypedText('');
      setAccuracy(100);
      setSpeed(0);
      setItemStartTime(null);
    } else {
      // 10개 전체 완료! 성공 처리
      handlePracticeSuccess();
    }
  };

  // 시간 만료 시 실패 처리
  const handleTimeOut = () => {
    setIsTimerRunning(false);
    setLocalNotification({
      text: '⏰ 시간 초과!\n아쉽게도 정해진 시간 안에 모두 완수하지 못해 배지를 획득하지 못했습니다. 다시 시도해 보세요!',
      onClose: () => {
        resetSession();
      }
    });
  };

  // 성공 시 배지 보상 지급 및 결과창 이동
  const handlePracticeSuccess = () => {
    setIsTimerRunning(false);
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    setTimeSpent(elapsedSeconds);

    // 평균 타수 계산 (세션 전체 누적 타수 / 누적 타이핑 시간)
    let finalTypingTime = sessionTypingTime;
    let finalKeystrokes = sessionKeystrokes;

    // 만약 타이핑 시간이 비정상적으로 작다면 전체 시간과 전체 글자수를 이용해 보정
    if (finalTypingTime < 1) {
      finalTypingTime = elapsedSeconds;
      finalKeystrokes = countKeystrokes(typedText) + finalKeystrokes;
    }

    const avg = finalTypingTime > 0.5 ? Math.round((finalKeystrokes / finalTypingTime) * 60) : 0;
    setAverageSpeed(Math.min(1200, avg));

    // 해당 등급의 배지 목록 필터링
    const tierBadges = BADGES.filter(b => b.tier === selectedTier);
    // 아직 안 뽑은 배지 우선 필터링
    const lockedTierBadges = tierBadges.filter(b => !unlockedBadges.includes(b.id));
    
    let targetBadge: Badge;
    if (lockedTierBadges.length > 0) {
      // 아직 안 뽑은 것 중 랜덤 하나 획득
      targetBadge = lockedTierBadges[Math.floor(Math.random() * lockedTierBadges.length)];
    } else {
      // 다 뽑았다면 해당 등급 전체 중 아무거나 하나 지급
      targetBadge = tierBadges[Math.floor(Math.random() * tierBadges.length)];
    }

    // 배지 로컬 스토리지 누적 저장
    const updated = Array.from(new Set([...unlockedBadges, targetBadge.id]));
    setUnlockedBadges(updated);
    localStorage.setItem('unlocked_economy_badges', JSON.stringify(updated));

    // 배지 획득 날짜 기입
    const today = new Date();
    const formatted = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
    setEarnDate(formatted);

    setEarnedBadge(targetBadge);
    setMode('result');
  };

  // 이미지 다운로드 기능 (Canvas 렌더링 후 다운로드)
  const handleDownloadBadge = async () => {
    if (!earnedBadge) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. 배경 그라데이션
    let grad = ctx.createLinearGradient(0, 0, 0, 600);
    if (earnedBadge.tier === 'coin') {
      grad.addColorStop(0, '#FFFDF5');
      grad.addColorStop(1, '#FEF3C7');
    } else if (earnedBadge.tier === 'banknote') {
      grad.addColorStop(0, '#F0FDF4');
      grad.addColorStop(1, '#DCFCE7');
    } else {
      grad.addColorStop(0, '#EEF2FF');
      grad.addColorStop(1, '#E0E7FF');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 600);

    // 테두리 액자 선
    ctx.lineWidth = 14;
    ctx.strokeStyle = earnedBadge.tier === 'coin' ? '#D97706' : earnedBadge.tier === 'banknote' ? '#059669' : '#4F46E5';
    ctx.strokeRect(20, 20, 560, 560);
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.strokeRect(32, 32, 536, 536);

    // 2. 상단 획득 일자
    ctx.font = 'bold 18px "Inter", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#6B7280';
    ctx.textAlign = 'center';
    ctx.fillText(`📅 획득 날짜: ${earnDate}`, 300, 70);

    // 3. 타이틀 헤더
    ctx.font = 'bold 26px "Inter", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#111827';
    ctx.fillText('🏆 주니어 경제 마스터 배지 🏆', 300, 110);

    // 4. 배지 이미지 또는 이모지 로드 및 그리기
    const img = new Image();
    img.src = `/badges/${earnedBadge.id}.png`;
    
    await new Promise<void>((resolve) => {
      img.onload = () => {
        // 배지 이미지를 240x240으로 크게 그리고 가로 세로 비율 맞춤 정중앙 배치
        ctx.drawImage(img, 180, 130, 240, 240);
        resolve();
      };
      img.onerror = () => {
        ctx.font = '140px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(earnedBadge!.icon, 300, 280);
        resolve();
      };
    });

    // 5. 배지 이름 (더 하단으로 배치)
    ctx.font = 'bold 30px "Inter", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = earnedBadge.tier === 'coin' ? '#B45309' : earnedBadge.tier === 'banknote' ? '#047857' : '#4338CA';
    ctx.fillText(earnedBadge.name, 300, 410);

    // 6. 배지 설명문 (더 하단으로 배치 및 자동 줄바꿈)
    ctx.font = 'normal 15px "Inter", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#4B5563';
    const desc = earnedBadge.description;
    
    // 줄바꿈 로직
    const chars = desc.split('');
    let line = '';
    let y = 450;
    for (let i = 0; i < chars.length; i++) {
      let testLine = line + chars[i];
      let metrics = ctx.measureText(testLine);
      if (metrics.width > 440) {
        ctx.fillText(line, 300, y);
        line = chars[i];
        y += 24;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 300, y);

    // 7. 하단 획득자 이름 표시 (배지 이미지의 제일 하단으로 배치, 꼬리말 문구는 삭제됨)
    ctx.font = 'bold 24px "Inter", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#1F2937';
    ctx.fillText(`획득자: ${earnerName || '자랑스러운 주니어'} 어린이`, 300, 540);

    // 이미지 파일 변환 및 다운로드 실행
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${earnerName ? earnerName : '경제마스터'}_${earnedBadge.name}.png`;
    link.href = image;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-0 md:p-4 animate-fadeIn">
      <div className="bg-[#F2F4F7] w-full h-full md:rounded-[40px] overflow-hidden shadow-2xl flex flex-col relative">
        
        {/* 헤더 */}
        <div className="p-5 md:p-6 bg-white border-b flex justify-between items-center sticky top-0 z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-black text-xl text-gray-950 tracking-tight">경제 자판 연습 ⌨️</h3>
              <p className="text-xs text-gray-400 font-bold tracking-tight">경제 낱말과 상식을 타이핑하며 귀여운 경제 배지를 모아봐요!</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-gray-50 hover:bg-gray-100 active:scale-95 text-gray-600 hover:text-gray-900 rounded-full transition-all shadow-sm border border-gray-100"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex-grow overflow-y-auto p-6 md:p-10 flex flex-col justify-between">
          
          {/* 1. 메인 메뉴 모드 */}
          {mode === 'menu' && (
            <div className="space-y-8 max-w-4xl mx-auto w-full">
              
              {/* 설명 배너 */}
              <div className="bg-white p-6 md:p-8 rounded-[32px] border border-amber-100 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                <div className="w-16 h-16 bg-amber-50 rounded-[22px] flex items-center justify-center shrink-0 shadow-inner">
                  <span className="text-3xl">🎯</span>
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-xl md:text-2xl font-black text-gray-950 tracking-tight mb-1">한글 타자 연습으로 배우는 유익한 금융경제!</h2>
                  <p className="text-sm text-gray-500 font-bold leading-relaxed">
                    난이도별 도전을 시간 제한 내에 멋지게 완수하고, 귀여운 등급별 컬렉션 배지를 획득해 보세요. <br className="hidden md:block" />
                    오타 비율이 많으면 합격되지 않으니 속도보다도 차분하고 정확하게 입력하는 것이 합격의 비결이랍니다!
                  </p>
                </div>
              </div>

              {/* 탭 메뉴 */}
              <div className="flex bg-gray-200 p-1 rounded-2xl max-w-md mx-auto relative z-10">
                <button
                  onClick={() => setActiveTab('practice')}
                  className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${
                    activeTab === 'practice'
                      ? 'bg-white text-gray-950 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  🎯 연습 및 도전하기
                </button>
                <button
                  onClick={() => setActiveTab('collection')}
                  className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${
                    activeTab === 'collection'
                      ? 'bg-white text-gray-950 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  🏅 내 배지 도감 ({unlockedBadges.length}/30)
                </button>
              </div>

              {activeTab === 'practice' ? (
                /* 등급별 연습 카드 그리드 */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                  
                  {/* 동전 등급 카드 */}
                  <div className="bg-white rounded-[32px] border border-gray-100 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl bg-yellow-50 p-3 rounded-2xl">🪙</span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-black rounded-full">초급</span>
                      </div>
                      <h3 className="text-lg font-black text-gray-950 mb-1">동전 등급 도전</h3>
                      <p className="text-xs text-gray-400 font-bold mb-4">경제 핵심 낱말 단어 연습</p>
                      <p className="text-sm text-gray-500 font-bold leading-relaxed mb-6">
                        소득, 세금, 물가, 저축 등 필수로 외워야 할 기초 금융 낱말 10개를 타이핑합니다.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="text-xs text-gray-400 font-bold flex flex-col gap-1.5 bg-gray-50 p-3.5 rounded-xl">
                        <div className="flex justify-between w-full">
                          <span>⏱️ 제한시간</span>
                          <span className="text-gray-800 font-black">60초</span>
                        </div>
                        <div className="flex justify-between w-full border-t border-gray-100 pt-1.5">
                          <span>🎁 성공 보상</span>
                          <span className="text-amber-600 font-black">동전 등급 배지 획득</span>
                        </div>
                      </div>
                      <button
                        onClick={() => startPractice('coin')}
                        className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-black rounded-2xl transition-all shadow-md active:scale-95"
                      >
                        도전 시작하기
                      </button>
                    </div>
                  </div>

                  {/* 지폐 등급 카드 */}
                  <div className="bg-white rounded-[32px] border border-gray-100 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl bg-green-50 p-3 rounded-2xl">💵</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-black rounded-full">중급</span>
                      </div>
                      <h3 className="text-lg font-black text-gray-950 mb-1">지폐 등급 도전</h3>
                      <p className="text-xs text-gray-400 font-bold mb-4">금융상식 짧은 한줄 글 연습</p>
                      <p className="text-sm text-gray-500 font-bold leading-relaxed mb-6">
                        신용, 기회비용, 환율의 주요 정의가 깔끔하게 담긴 한 줄 문장 10개를 빠르게 정독합니다.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="text-xs text-gray-400 font-bold flex flex-col gap-1.5 bg-gray-50 p-3.5 rounded-xl">
                        <div className="flex justify-between w-full">
                          <span>⏱️ 제한시간</span>
                          <span className="text-gray-800 font-black">180초</span>
                        </div>
                        <div className="flex justify-between w-full border-t border-gray-100 pt-1.5">
                          <span>🎁 성공 보상</span>
                          <span className="text-green-600 font-black">지폐 등급 배지 획득</span>
                        </div>
                      </div>
                      <button
                        onClick={() => startPractice('banknote')}
                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl transition-all shadow-md active:scale-95"
                      >
                        도전 시작하기
                      </button>
                    </div>
                  </div>

                  {/* 보석 등급 카드 */}
                  <div className="bg-white rounded-[32px] border border-gray-100 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl bg-blue-50 p-3 rounded-2xl">💎</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-black rounded-full">고급</span>
                      </div>
                      <h3 className="text-lg font-black text-gray-950 mb-1">보석 등급 도전</h3>
                      <p className="text-xs text-gray-400 font-bold mb-4">다이아몬드 긴 경제 장문 연습</p>
                      <p className="text-sm text-gray-500 font-bold leading-relaxed mb-6">
                        스토리와 인과관계를 가진 3줄 이상의 알찬 설명문 10개를 정확하고 완벽하게 타이핑합니다.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="text-xs text-gray-400 font-bold flex flex-col gap-1.5 bg-gray-50 p-3.5 rounded-xl">
                        <div className="flex justify-between w-full">
                          <span>⏱️ 제한시간</span>
                          <span className="text-gray-800 font-black">400초</span>
                        </div>
                        <div className="flex justify-between w-full border-t border-gray-100 pt-1.5">
                          <span>🎁 성공 보상</span>
                          <span className="text-blue-600 font-black">보석 등급 배지 획득</span>
                        </div>
                      </div>
                      <button
                        onClick={() => startPractice('jewel')}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-md active:scale-95"
                      >
                        도전 시작하기
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                /* 내 배지 도감 컬렉션 */
                <div className="space-y-8 animate-fadeIn">
                  <div className="bg-white p-6 rounded-[32px] border border-amber-100 flex items-center justify-between shadow-sm">
                    <div>
                      <h3 className="font-black text-lg text-gray-950 mb-1">내 경제 배지 컬렉션 🏅</h3>
                      <p className="text-xs text-gray-500 font-bold">자판 연습을 완료하고 30종의 모든 배지를 수집해 보세요.</p>
                      <p className="text-[11px] text-rose-500 font-bold mt-1.5 leading-relaxed">
                        ※ 배지 컬렉션 정보는 동일한 기기 안에서만 정보가 보입니다. 배지를 다운로드 해서 보관해주세요.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-amber-500 font-mono">{unlockedBadges.length}</span>
                      <span className="text-sm font-bold text-gray-400"> / 30 획득</span>
                    </div>
                  </div>

                  {/* 계열별 그룹 */}
                  {(['coin', 'banknote', 'jewel'] as const).map(tier => {
                    const tierTitle = tier === 'coin' ? '🪙 동전 계열 (초급)' : tier === 'banknote' ? '💵 지폐 계열 (중급)' : '💎 보석 계열 (고급)';
                    const tierBadges = BADGES.filter(b => b.tier === tier);
                    const tierColor = tier === 'coin' ? 'text-amber-600' : tier === 'banknote' ? 'text-green-600' : 'text-indigo-600';
                    const bgClass = tier === 'coin' ? 'bg-amber-50/40' : tier === 'banknote' ? 'bg-green-50/40' : 'bg-indigo-50/40';

                    return (
                      <div key={tier} className={`p-6 rounded-[32px] ${bgClass} border border-gray-100 space-y-4`}>
                        <h4 className={`font-black text-sm ${tierColor}`}>{tierTitle}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                          {tierBadges.map(badge => {
                            const isUnlocked = unlockedBadges.includes(badge.id);
                            return (
                              <div
                                key={badge.id}
                                className={`bg-white p-4 rounded-2xl border flex flex-col items-center text-center justify-between shadow-sm transition-all relative group h-36 ${
                                  isUnlocked ? 'border-amber-200 bg-white' : 'border-gray-100 opacity-60'
                                }`}
                              >
                                {/* 배지 이미지/아이콘 */}
                                <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                                  {isUnlocked ? (
                                    <BadgeImage
                                      id={badge.id}
                                      name={badge.name}
                                      icon={badge.icon}
                                      className="w-16 h-16 object-contain text-4xl flex items-center justify-center"
                                    />
                                  ) : (
                                    <div className="relative">
                                      <span className="text-4xl filter grayscale contrast-50 opacity-40">{badge.icon}</span>
                                      <div className="absolute inset-0 flex items-center justify-center bg-gray-950/20 rounded-full">
                                        <span className="text-sm">🔒</span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <span className={`text-xs font-black ${isUnlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {badge.name}
                                </span>

                                {/* 마우스 호버 시 설명 툴팁 */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-3 bg-gray-950 text-white text-[10px] font-bold rounded-lg shadow-lg z-20 pointer-events-none leading-relaxed text-center">
                                  <p className="font-black text-amber-400 mb-1">{badge.name}</p>
                                  <p className="text-gray-300">{badge.description}</p>
                                  {!isUnlocked && (
                                    <p className="text-rose-400 mt-1 font-black">
                                      {tier === 'coin' ? '동전' : tier === 'banknote' ? '지폐' : '보석'} 등급 도전을 완료해 획득하세요!
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}


          {/* 2. 실제 타이핑 연습 화면 모드 */}
          {mode === 'practice' && (
            <div className="flex-grow flex flex-col justify-between max-w-3xl mx-auto w-full py-4">
              
              {/* 타자 상단 상태 표시기 */}
              <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex items-center justify-between shrink-0 mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                    단계 {currentIndex + 1} / 10
                  </span>
                  <div className="h-2 w-32 md:w-48 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300" 
                      style={{ width: `${(currentIndex + 1) * 10}%` }}
                    />
                  </div>
                </div>

                {/* 실시간 타이머 및 수치 */}
                <div className="flex items-center gap-3">
                  <div className="text-center font-mono">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">타수</p>
                    <p className="text-sm font-black text-indigo-600">{speed} 타</p>
                  </div>
                  <div className="text-center font-mono border-l pl-3">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">정확도</p>
                    <p className={`text-sm font-black ${accuracy < 70 ? 'text-red-500 animate-pulse' : 'text-green-600'}`}>{accuracy}%</p>
                  </div>
                  <div className="text-center font-mono border-l pl-3">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">남은시간</p>
                    <p className={`text-sm font-black ${timeLeft < 15 ? 'text-red-600 animate-bounce' : 'text-gray-950'}`}>
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 입력 가이드 및 타겟 텍스트 표시 영역 */}
              <div className="flex-grow flex flex-col justify-center bg-white border border-gray-100 p-6 md:p-10 rounded-[36px] shadow-sm mb-6 relative min-h-[220px]">
                
                {/* 힌트 및 서브 타이틀 */}
                <div className="absolute top-4 left-6 text-xs text-amber-500 font-bold flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full">
                  <span>💡 {selectedTier === 'coin' ? '낱말' : selectedTier === 'banknote' ? '짧은 글' : '3줄 긴 글'} 학습 중</span>
                </div>

                <div className="w-full text-center space-y-6">
                  {/* 써야 할 문장 */}
                  <div className="text-lg md:text-xl font-black text-gray-900 leading-relaxed tracking-tight select-none select-none select-none max-w-2xl mx-auto font-mono">
                    {sessionTexts[currentIndex]?.split('').map((char, index) => {
                      let charColor = "text-gray-700";
                      let bgClass = "";
                      
                      if (index < typedText.length) {
                        if (typedText[index] === char) {
                          charColor = "text-green-600 font-black";
                        } else {
                          charColor = "text-white";
                          bgClass = "bg-red-500 rounded-sm";
                        }
                      } else if (index === typedText.length) {
                        bgClass = "bg-amber-100 border-b-2 border-amber-500 animate-pulse";
                      }

                      return (
                        <span key={index} className={`${charColor} ${bgClass} px-0.5 inline-block transition-colors font-mono`}>
                          {char}
                        </span>
                      );
                    })}
                  </div>

                  {/* 입력창 */}
                  <div className="w-full max-w-xl mx-auto pt-4 relative flex items-center">
                    {selectedTier === 'jewel' ? (
                      <div className="relative w-full">
                        <textarea
                          value={typedText}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="위 긴 글 문장을 알맞게 따라서 끝까지 입력하세요..."
                          className="w-full min-h-[110px] pl-5 pr-20 py-4 bg-gray-50 border-2 border-gray-100 focus:border-amber-500 focus:bg-white text-gray-900 font-black rounded-2xl transition-all shadow-inner outline-none text-base font-mono resize-none leading-relaxed"
                          autoFocus
                        />
                        {typedText.trim() && (
                          <button 
                            onClick={submitCurrentText}
                            className="absolute right-3 bottom-3 px-4 py-2 bg-amber-500 text-white font-black text-xs rounded-xl shadow-sm hover:bg-amber-600 transition-all active:scale-95 z-10"
                          >
                            등록 ↵
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-full">
                        <input
                          type="text"
                          value={typedText}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="알맞은 텍스트를 입력하고 Enter 키를 누르세요..."
                          className="w-full pl-5 pr-20 py-4 bg-gray-50 border-2 border-gray-100 focus:border-amber-500 focus:bg-white text-gray-900 font-black rounded-2xl transition-all shadow-inner outline-none text-base text-center font-mono"
                          autoFocus
                        />
                        {typedText.trim() && (
                          <button 
                            onClick={submitCurrentText}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-amber-500 text-white font-black text-xs rounded-xl shadow-sm hover:bg-amber-600 transition-all active:scale-95 z-10"
                          >
                            등록 ↵
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 font-bold">
                    * 정확도가 70% 미만일 경우 완료되지 않으니 천천히 정확하게 입력해주세요.
                  </p>
                </div>
              </div>

              {/* 뒤로가기/종료 버튼 */}
              <div className="flex justify-between items-center shrink-0">
                <button
                  onClick={() => {
                    setConfirmExit(true);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-xs font-black transition-all active:scale-95"
                >
                  <BackIcon className="w-4 h-4" />
                  <span>중단하고 나가기</span>
                </button>
                <span className="text-xs text-gray-400 font-bold">화면 우측 하단의 등록을 누르거나 키보드 Enter를 치시면 제출됩니다.</span>
              </div>

            </div>
          )}

          {/* 3. 성공 및 배지 획득 결과 화면 모드 */}
          {mode === 'result' && earnedBadge && (
            <div className="flex-grow flex flex-col justify-center items-center max-w-2xl mx-auto w-full py-4 text-center">
              
              {/* 폭죽 웅장한 효과 */}
              <div className="relative mb-4 animate-fadeIn flex flex-col items-center">
                <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-[32px] shadow-xl relative z-10 animate-bounce flex items-center justify-center overflow-hidden p-3 border border-amber-200">
                  <BadgeImage id={earnedBadge.id} name={earnedBadge.name} icon={earnedBadge.icon} className="w-full h-full object-contain text-5xl md:text-6xl flex items-center justify-center" />
                </div>
                <div className="absolute -top-3 -right-3 text-2xl animate-bounce">✨</div>
                <div className="absolute -bottom-3 -left-3 text-2xl animate-ping">👑</div>
              </div>

              <span className="px-4 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-full uppercase tracking-widest mb-2">
                {selectedTier === 'coin' ? '동전 등급 완료' : selectedTier === 'banknote' ? '지폐 등급 완료' : '보석 등급 완료'}
              </span>

              <h2 className="text-xl md:text-2xl font-black text-gray-950 tracking-tight mb-1">
                경제 배지 획득을 축하합니다! 🎉
              </h2>

              <p className="text-xs text-amber-600 font-black mb-4">
                📅 배지 획득일: {earnDate}
              </p>
              
              <div className="bg-white p-5 rounded-[28px] border border-amber-100 shadow-sm max-w-md w-full mb-6 text-center">
                <h3 className="font-black text-lg text-amber-600 mb-0.5">{earnedBadge.name}</h3>
                <p className="text-[10px] text-gray-400 font-bold mb-3">수집 완료 ({earnedBadge.tier === 'coin' ? '동전' : earnedBadge.tier === 'banknote' ? '지폐' : '보석'} 계열)</p>
                <p className="text-xs text-gray-500 font-bold leading-relaxed mb-4 px-2">
                  "{earnedBadge.description}"
                </p>

                {/* 이름 기입 폼 */}
                <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100 text-left mb-3">
                  <label className="block text-[11px] font-black text-amber-950 mb-1.5">
                    📛 배지에 새겨질 획득자 이름 입력
                  </label>
                  {isNameLocked ? (
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-amber-200">
                      <span className="text-xs font-black text-gray-900">{earnerName} 어린이</span>
                      <span className="text-[9px] px-2 py-0.5 bg-amber-500 text-white font-black rounded">이름 등록 완료 🔒</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                          type="text"
                          value={earnerName}
                          onChange={(e) => setEarnerName(e.target.value)}
                          placeholder="이름을 기입하세요 (등록 후 수정 불가)"
                          className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:outline-none focus:border-amber-500"
                          maxLength={8}
                      />
                      <button
                          onClick={() => handleLockName(earnerName)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-lg transition-all active:scale-95 shadow-sm shrink-0"
                      >
                        이름 등록
                      </button>
                    </div>
                  )}
                  <p className="text-[9px] text-amber-800/80 font-bold mt-1.5 leading-snug">
                    * 이름을 기입한 후 등록하면 다시 수정할 수 없으며, 이미지 다운로드 시 배지에 새겨집니다.
                  </p>
                </div>
                
                <div className="pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                  <div className="font-mono">
                    <p className="text-[9px] text-gray-400 font-bold">소요 시간</p>
                    <p className="text-xs md:text-sm font-black text-gray-900">{timeSpent}초</p>
                  </div>
                  <div className="font-mono border-l border-gray-100">
                    <p className="text-[9px] text-gray-400 font-bold">평균 타수</p>
                    <p className="text-xs md:text-sm font-black text-indigo-600">{averageSpeed} 타</p>
                  </div>
                  <div className="font-mono border-l border-gray-100">
                    <p className="text-[9px] text-gray-400 font-bold">합격 등급</p>
                    <p className="text-[10px] md:text-xs font-black text-amber-500 uppercase">
                      {selectedTier === 'coin' ? 'Coin' : selectedTier === 'banknote' ? 'Banknote' : 'Jewel'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 이미지 다운로드 및 복귀 버튼 */}
              <div className="flex flex-col gap-2.5 w-full max-w-sm">
                <button
                  onClick={handleDownloadBadge}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 text-xs"
                >
                  📥 태블릿에 경제 배지 이미지 다운로드하기
                </button>
                <button
                  onClick={resetSession}
                  className="w-full py-3 bg-gray-950 hover:bg-gray-900 text-white font-black rounded-xl transition-all shadow-md active:scale-95 text-xs"
                >
                  메인 메뉴로 돌아가기
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Custom Confirmation Dialog for Exit */}
        {confirmExit && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl animate-scaleUp">
              <span className="text-4xl block mb-4">⚠️</span>
              <h4 className="text-lg font-black text-gray-950 mb-2">자판 연습 중단하기</h4>
              <p className="text-sm text-gray-500 font-bold leading-relaxed mb-6">
                정말로 자판 연습 도전을 포기하고 메인 메뉴로 나가시겠습니까? 진행 중인 기록과 남은 시간은 모두 사라집니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmExit(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-xl text-xs transition-all"
                >
                  계속 하기
                </button>
                <button
                  onClick={() => {
                    setConfirmExit(false);
                    resetSession();
                  }}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl text-xs transition-all shadow-md active:scale-95"
                >
                  포기하고 나가기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Local Notification Alert */}
        {localNotification && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl animate-scaleUp">
              <span className="text-4xl block mb-4">🔔</span>
              <h4 className="text-lg font-black text-gray-950 mb-2">알림</h4>
              <p className="text-sm text-gray-500 font-bold leading-relaxed mb-6 whitespace-pre-line">
                {localNotification.text}
              </p>
              <button
                onClick={() => {
                  const cb = localNotification.onClose;
                  setLocalNotification(null);
                  if (cb) cb();
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs transition-all shadow-md active:scale-95"
              >
                확인
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
