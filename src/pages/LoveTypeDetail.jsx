import React from "react";
import "./LoveType.css";
import RandomImage from "../RandomImage";
import { useNavigate } from "react-router-dom";



const QA = ({q, a}) => (
  <div className="lovetype-qa"><span className="lovetype-q">Q.</span> {q}<br/><span className="lovetype-a"> {a}</span></div>
);

const Table = ({rows, head}) => (
  <table className="lovetype-table">
    {head && <thead><tr>{head.map((h,i)=><th key={i}>{h}</th>)}</tr></thead>}
    <tbody>
      {rows.map((row,i)=>(<tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>))}
    </tbody>
  </table>
);

const SectionBadge = ({icon, label}) => (
  <span className="lovetype-section-badge">{icon} {label}</span>
);

const getSectionsWithImages = (sections) => {
  // 2~4곳에만 랜덤 이미지 삽입
  const insertPositions = [1, 3, 5]; // 예시: 2,4,6번째 섹션 뒤
  let result = [];
  let imgIdx = 0;
  sections.forEach((sec, idx) => {
    result.push(sec);
    if (insertPositions.includes(idx)) {
      result.push(<RandomImage key={`img-${imgIdx++}`} />);
    }
  });
  return result;
};

const sanghyunSections = [
  (<section className="lovetype-section" key="sec1">
    <SectionBadge icon="💎" label="키워드" />
    <h3>1. 나를 정의하는 키워드</h3>
    <b>◼ 단어 연상 테스트</b>
    <Table head={["구분", "선택한 단어"]} rows={[
      [<span style={{fontWeight:'bold',color:'#4caf50'}}>나를 표현하는 단어</span>, "눈에 띄는, 섹시한, 매너 있다"],
      [<span style={{fontWeight:'bold',color:'#4caf50'}}>연인에게 바라는 단어</span>, "배려심 있는, 사랑스러운"],
      [<span style={{fontWeight:'bold',color:'#4caf50'}}>어울리지 않는 단어</span>, "무뚝뚝하다, 계산적"],
    ]} />
    <div style={{marginTop: "0.7em", marginBottom: "0.7em", color: "#6b6b6b"}}>
      "다른 사람과는 달리 감정 표현이 솔직한 편이에요. 연인과는 서로 배려하며 채워가는 관계를 원해요."
    </div>
  </section>),
  (<section className="lovetype-section" key="sec2">
    <SectionBadge icon="🌱" label="마음구조" />
    <h3>2. 마음 구조 분석</h3>
    <b>◼ 내 마음의 지도</b>
    <Table head={["영역", "특징"]} rows={[
      [<span style={{fontWeight:'bold',color:'#4caf50'}}>중심</span>, "배려 💝"],
      [<span style={{fontWeight:'bold',color:'#4caf50'}}>강점</span>, "계획적·감정 공유"],
      [<span style={{fontWeight:'bold',color:'#4caf50'}}>약점</span>, "우울감·감정 조절 실패"],
    ]} />
    <b style={{marginTop: "1.2em", display: "block"}}>◼ 연인에게 바라는 마음</b>
    <Table head={["영역", "바라는 점"]} rows={[
      [<span style={{fontWeight:'bold',color:'#4caf50'}}>중심</span>, "자신감 ✨"],
      [<span style={{fontWeight:'bold',color:'#4caf50'}}>강점</span>, "공감 능력, 다정함"],
      [<span style={{fontWeight:'bold',color:'#4caf50'}}>걱정</span>, "과도한 쿨함"],
    ]} />
  </section>),
  (<section className="lovetype-section" key="sec3">
    <SectionBadge icon="🍃" label="감정흐름" />
    <h3>3. 연애 감정의 흐름</h3>
    <b>◼ 1단계: 설렘</b>
    <ul>
      <li><span style={{fontWeight:'bold',color:'#4caf50'}}>첫 마음</span>: "상대가 작은 배려를 보일 때 (ex. 먼저 연락오기)"</li>
      <li><span style={{fontWeight:'bold',color:'#4caf50'}}>함께 있을 때</span>: "편안함 + 이해받는 느낌" 🤗</li>
    </ul>
    <b>◼ 2단계: 헷갈림</b>
    <ul>
      <li><span style={{fontWeight:'bold',color:'#4caf50'}}>불안 요소</span>: "상대가 무심한 척하거나 벽을 세울 때"</li>
      <li><span style={{fontWeight:'bold',color:'#4caf50'}}>내 반응</span>: 참다가 → 갑작스런 감정 폭발 💥</li>
    </ul>
    <b>◼ 3단계: 불안</b>
    <ul>
      <li><span style={{fontWeight:'bold',color:'#4caf50'}}>대표 감정</span>: "불안" (연락이 뜸할 때)</li>
      <li><span style={{fontWeight:'bold',color:'#4caf50'}}>행동</span>: 표현을 줄이고 거리둠 → "나도 무심한 척하게 돼요"</li>
    </ul>
    <b>◼ 4단계: 거리감</b>
    <ul>
      <li><span style={{fontWeight:'bold',color:'#4caf50'}}>상태</span>: "포기 직전의 단념" 😔</li>
      <li><span style={{fontWeight:'bold',color:'#4caf50'}}>원인</span>: 대화 단절, 반응 없음</li>
    </ul>
  </section>),
  (<section className="lovetype-section" key="sec4">
    <SectionBadge icon="📅" label="기억" />
    <h3>4. 기억에 남는 순간</h3>
    <Table head={["순간", "감정"]} rows={[
      [<span style={{fontWeight:'bold',color:'#4caf50'}}>장거리 연애 중 마음이 커진 때</span>, "서로를 채워간다는 느낌 💌"],
      [<span style={{fontWeight:'bold',color:'#4caf50'}}>매일 일기 공유</span>, "사랑이 쌓이는 걸 느꼈어요"],
      [<span style={{fontWeight:'bold',color:'#4caf50'}}>첫 갈등</span>, "좋아서 힘든 것도 처음이었어요"],
    ]} />
  </section>),
  (<section className="lovetype-section" key="sec5">
    <SectionBadge icon="💡" label="패턴" />
    <h3>5. 연애 패턴 총정리</h3>
    <b>◼ 반복되는 감정: <span style={{color:'#4caf50'}}>불안</span></b>
    <div style={{marginBottom: "0.5em"}}>
      "감정을 표현하지 않고 참다가 쌓이면 불안해져요."
    </div>
    <b>◼ 바라는 변화:</b>
    <ul>
      <li><span style={{color:'#4caf50'}}>나만 애쓰지 않는 관계</span></li>
      <li><span style={{color:'#4caf50'}}>있는 그대로 받아줄 수 있는 사랑</span></li>
    </ul>
    <b>◼ 사랑 유형: <span style={{color:'#4caf50'}}>마니아형 (집착형)</span></b>
    <ul>
      <li>특징: 질투·의심·애착 강함 😅</li>
      <li>"한번 빠지면 헤어나오기 어려워요."</li>
    </ul>
  </section>),
  (<section className="lovetype-section" key="sec6">
    <SectionBadge icon="✉️" label="마무리" />
    <h3>✉️ 마무리</h3>
    <div className="lovetype-quote" style={{fontSize: "1.08em", lineHeight: "2.1", color: "#7a4b8a"}}>
      "이 리포트는 내 진심을 전달하기 위해 정리했어요.<br/>
      가끔은 불안해도, 너를 생각하는 마음은 변하지 않을 거예요.<br/>
      함께 성장하는 연애를 만들어가고 싶어요. 💖"
    </div>
  </section>),
];

const hyeeunSections = [
  (<section className="lovetype-section" key="sec-empty">
    <div style={{color:'#b0b0b0',fontSize:'1.1rem'}}>페이지 내용은 곧 추가될 예정입니다 :)</div>
  </section>),
];

const LoveTypeDetail = ({ who }) => {
  let name, type, sections;
  if (who === "sanghyun") {
    name = "상현";
    type = "ENTP";
    sections = sanghyunSections;
  } else {
    name = "혜은";
    type = "ENFJ";
    sections = hyeeunSections;
  }
  return (
    <div className="lovetype-container vertical">
      {/* ✅ 홈으로 돌아가기 버튼 정상 위치 */}
      <button className="back-home-btn" onClick={() => navigate("/")}>← 홈으로</button>

      <h2>{name}의 연애 심리 리포트</h2>
      <div style={{color:'#6abf7a',fontSize:'1.1rem',marginBottom:'1.2rem'}}>({type})</div>
      {getSectionsWithImages(sections)}
    </div>
  );
};

export default LoveTypeDetail;
