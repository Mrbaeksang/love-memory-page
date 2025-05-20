import React from "react";
import "./LoveType.css";
import RandomImage from "../RandomImage";
import { useNavigate } from "react-router-dom";
import usePageLogger from "../hooks/usePageLogger"; // ✅ 추가




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
    <SectionBadge icon="☕" label="선호" />
    <h3>1. 선호하는 데이트 & 음식</h3>
    <b>◼ 선호하는 데이트</b>
    <p>이색 카페, 영화, 힐링, 산책, 여행, 칵테일 바, 보드게임, 운동, 맛집 투어, 글램핑, 동물원, 공원</p>
    <b>◼ 선호하는 음식</b>
    <p>한식, 중식, 일식, 양식, 고기, 회, 향신료, 매운 음식, 면, 국/탕, 소주, 맥주, 칵테일, 막걸리, 분식, 치킨, 빵, 커피, 차</p>
  </section>),

  (<RandomImage key="img-1" />),

  (<section className="lovetype-section" key="sec2">
    <SectionBadge icon="🧠" label="사고방식" />
    <h3>2. 개방성과 신뢰</h3>
    <b>◼ 개방성</b>
    <p>최대한 변하는 세상에 뒤쳐지지 않으려하고 사람의 다양성을 존중하려한다. 꼰대적 마인드를 싫어한다.</p>
    <b>◼ 사람들이 나에 대해 쉽게 오해하는 것은 무엇인가요?</b>
    <p>감정이 없는 로봇으로 안다... 티를 안낼뿐 똑같다.</p>
    <b>◼ 보통 타인을 신뢰하기까지 어느 정도의 시간이 걸리나요, 왜 그정도의 시간이 필요한가요?</b>
    <p>시간은 의미가없다고 생각한다, 10년 넘게 믿은 사람도 하루아침에 배신을하고 분명 나도 누군가에게는 신뢰받지 못하는 사람일 것이다. 신뢰는 상호작용하기에 믿을만하다고 느꼈을 떄 조금씩 믿어가는 편인거 같다.</p>
  </section>),

  (<section className="lovetype-section" key="sec3">
    <SectionBadge icon="🤝" label="배려와 리드" />
    <h3>3. 연애 속 역할</h3>
    <b>◼ 개인적인 문제, 생활패턴, 직장 학교 등 바꿀 수 없는 환경 떄문에 연인이 나에 대해 배려해 주었으면 하는 것은 무엇인가요?</b>
    <p>나의 사고방식, 신념</p>
    <b>◼ 내가 생각하는 배려란 무엇인가요?</b>
    <p>상대방이 원하는걸 해주는 것<br/>
    ps.내 생각에는 배려라도 상대방이 원하지 않으면 싫을수 있기에</p>
    <b>◼ 내가 생각하는 연애에서 리드란 무엇인가요?</b>
    <p>데이트든 뭐든 먼저 방향을 잡는 것</p>
  </section>),
    (<RandomImage key="img-2" />),

  (<section className="lovetype-section" key="sec4">
    <SectionBadge icon="📱" label="SNS & 첫인상" />
    <h3>4. SNS 표현과 고민, 첫인상</h3>
    <b>◼ 우리의 연애를 SNS, 프로필 사진 등으로 표현하는 것에 대해 어떻게 생각하나요? 그렇게 생각하는 이유는 무엇인가요?</b>
    <p>좋다고 생각한다. 솔직히 자랑하고 싶기도 하고 그 전에 딱히 올린적이 별로 없기에 남이 보기에도 불편하지 않을거라 생각해서</p>
    <b>◼ 요즘 나의 가장 큰 고민은 무엇인가요?</b>
    <p>출가, 언제 독립할건지</p>
    <b>◼ 상대방의 첫인상은 어땠나요?</b>
    <p>예쁜데 조금 싸가지 없어 보였다. 자기가 자기 예쁜거 아는? 그래서 좀 건방진? 알고보니 그냥 낮가리고 조용한거 였지만</p>
  </section>),

  (<section className="lovetype-section" key="sec5">
    <SectionBadge icon="💓" label="애정 표현" />
    <h3>5. 사랑을 표현하는 방법</h3>
    <b>◼ 상대방에게 진심으로 사랑받고 있구나라고 느낀 말이나 행동은 무엇인가요?</b>
    <p>만나야해서, 연락해야해서가 아닌 진짜 내가 생각이나서 보자고 말하고 카톡하는게 느껴질때</p>
    <b>◼ 나는 주로 어떤 방법으로 연인에게 애정표현을 하고 있나요?</b>
    <p>직설적이게 말하거나 붙어있으려함 ex) 손 잡기, 안기</p>
    <b>◼ 상대방이 나에게 해주었으면 하는 애정표현 방법은 무엇인가요?</b>
    <p>자주 말로 표현해주기</p>
    <b>◼ 내가 힘들 때, 상대방의 어떤 행동이 가장 위로가 되었나요?</b>
    <p>내가 우선이라고 느끼게 해줬을 때</p>
  </section>),

  (<section className="lovetype-section" key="sec6">
    <SectionBadge icon="🗣️" label="연애 속 소통" />
    <h3>6. 소통의 방식</h3>
    <b>◼ 연인이 나에게 바라거나 원하는 것이 있을 때, 어떻게 표현을 해주었으면 하나요?</b>
    <p>직설적으로 말해줬으면 함 그게 너무 힘들면 간접적으로라도</p>
    <b>◼ 나는 바라거나 원하는 것이 있을 때, 어떻게 상대방에게 이야기하나요?</b>
    <p>직접 말함 대신 고민후에...</p>
    <b>◼ 나는 주로 ( 불안해질 ) 때 힘들어,<br/>
    그래서 나는 힘이 들 때 주로 ( 불안하다고 말하는 ) 식으로 행동을 하는 편이야,<br/>
    그럴 때는 네가 ( 내가 우선이라는걸 말이나 행동으로 ) 해주면 내가 좀 더 마음이 편안해질 것 같아.</b>
  </section>),
    (<RandomImage key="img-3" />),

  (<section className="lovetype-section" key="sec7">
    <SectionBadge icon="📞" label="연락과 질투" />
    <h3>7. 연락과 감정 표현</h3>
    <b>◼ 연인이 나에게 본인의 힒듬을 표현하지 않는다면 둘 중 어느 생각과 가까운 마음이 들까요?</b>
    <p>왜 나에게 말을 하지 않았을까 생각이 들고 도움을 못 주어서 미안하다.</p>
    <b>◼ 해보고 싶은 이색 데이트가 있다면 무엇인가요?</b>
    <p>해외여행 ( 아무도 우리를 모르고 이색적인곳 가고싶음, 국내 포함! )</p>
    <b>◼ 내가 가지고 있는 특별한 로망은 무엇인가요?</b>
    <p>연인과 취미 생활 공유하기</p>
    <b>◼ 우리가 더 깊은 관계가 되기 전 나를 위해 더 배려 해주었으면 하는 부분은 무엇인가요?</b>
    <p>생각을 자주 공유해주고 혼자 끙끙대기보단 같이 얘기해줘</p>
  </section>),

  (<section className="lovetype-section" key="sec8">
    <SectionBadge icon="⏱️" label="연락 빈도" />
    <h3>8. 사랑과 연락의 연결</h3>
    <b>◼ 연락의 빈도가 사랑의 크기와 비례한다고 생각하나요?</b>
    <p>그렇다. 연락해야지가 아니고 일상생활 중에서도 그냥 생각이나서 연락하고 연락을 보기 때문이다.</p>
    <b>◼ 서로가 아무리 바쁘더라도 내가 생각하는 최소한의 연락빈도는 어떻게 되나요?</b>
    <p>상황마다 다름 놀 때 기준으로는 30분정도?</p>
    <b>◼ 상대방이 연락할 수 없는 상황에 자주 놓인다면, 내 마음은 어떤가요?</b>
    <p>좋진 않지만 이해하려고 한다.</p>
    <b>◼ 연인이 술자리 혹은 친구들과 놀 때, 어떻게 해주면 내 마음이 좀 더 편안할 것 같나요?</b>
    <p>내가 술먹을 때 연락하는 것처럼 해주면?</p>
  </section>),

  (<section className="lovetype-section" key="sec9">
    <SectionBadge icon="💢" label="질투 & 개인 활동" />
    <h3>9. 질투와 혼자/함께의 행복</h3>
    <b>◼ 연인이 다른 사람들에게 하는 행동을 보고 질투심을 느껴본 적이 있다면 이유가 무엇인가요?</b>
    <p>나말고 모두에게 친절하고 착할 때<br/>그래도 타인에게는 선이 있었으면 좋겠고 나한테 좀 더 친절하고 착하게 대해주면 좋겠다.</p>
    <b>◼ 연인과 같이 하는 활동이 아닌 혼자서 어떤 활동을 할 때 행복감을 느끼나요?</b>
    <p>시사나 경제 관련 뉴스나 영상보기, 역사지식이나 상식을 증진시켜 줄 수 있는 영상보기, 노래부르기</p>
    <b>◼ 나는 연인과 같이 어떤 활동을 할 때, 행복감을 느끼나요?</b>
    <p>같이 어떠한 주제로 얘기를 나누며 서로의 '생각'을 공유하기, 땡기는 안주 정해서 같이 술먹기, 같이 장보러가기, 산책하기, 트래킹가기, 사진 스팟 보이면 사진 찍기, 같이 꼭 안고 누워있기</p>
  </section>),
    (<RandomImage key="img-4" />),

  (<section className="lovetype-section" key="sec10">
    <SectionBadge icon="💖" label="사랑과 행복" />
    <h3>10. 사랑과 행복의 의미</h3>
    <b>◼ 나에게 사랑이란 어떤 의미인가요?</b>
    <p>나보다 상대를 아끼고 생각할 때</p>
    <b>◼ 나에게 있어서 행복이란 무엇인가요?</b>
    <p>아무 걱정없이 온전히 즐기는 것</p>
  </section>),

  (<section className="lovetype-section" key="sec11">
    <SectionBadge icon="🔊" label="애정 표현 방식" />
    <h3>11. 내가 받고 싶은 애정 표현 방식</h3>
    <b>◼ 애정표현을 '언어'로 받고 싶은 사람에게 이렇게 해주세요.</b>
    <p>
      이들은 언어적인 표현에 민감하기 때문에 사소한 칭찬이라도 크게 마음에 남을 수 있습니다. 항상 언어 표현에 있어서는 신중하게 말해주려는 이들은 큰 사랑을 당신에게서 느낍니다.
      특히나 이들은 당신에게 말로써 인정받고 싶어 하기 때문에 식당에서 먼저 물을 따라주는 것 등 항상 사소한 것들의 표현을 꼭 해주세요.
      그러면 그것에 더 기분이 좋아지고 마치 어린아이처럼 당신을 위해 더 많은 노력과 배려를 할 것입니다. "고마워. 네가 최고야" 이란 표현들을 더 적극적으로 많이 해주세요.
      상대를 칭찬하는 것이 아니라 그 사람이 노력한 부분을 짚어서 이야기해준다면 효과는 더더욱 배가 됩니다.
      <br/><br/>
      "오늘 데이트 정말 즐거웠어 (X)"<br/>
      "오늘 네가 짜온 데이트 정말 즐거웠어 (O)"<br/><br/>
      '사랑해'라는 말도 좋지만 이들에게는 '고마워'라는 말이 더 효과적입니다.
    </p>

    <b>◼ 애정표현을 '함께', '같이'로 받고 싶은 사람에게 이렇게 해주세요.</b>
    <p>
      이들은 자신이 원하는 만큼 애정표현이 충분하지 않다고 느끼면 그것을 채우기 위해 잦은 연락, 데이트를 원하는 경우가 있습니다.
      때로는 이런 표현을 잘 돌려주지 못하고 삐진 듯이 구석진 곳에서 자신의 감정을 묻어둡니다.
      앞서 말한 것처럼 이들은 양이 중요한 것이 아니라 상대가 나에게 얼마나 많이 돌려주는지 중요합니다.
      같이 즐길 수 있는 취미 생활이나, 대화 주제를 찾아 그 시간만큼은 온전히 상대방에게 집중해주고 사랑을 적극적으로 표현해 주세요.
      또한 이들은 연락의 양이 절대적으로 중요한 것은 아니지만 다른 표현 방식에 비해 연락을 많이 주고받기를 원합니다.
      이들은 "보고 싶어"라는 말을 듣기 좋아합니다. 따라서 무리하지 않는 선에서 연락을 자주 해주세요.
    </p>
  </section>),

  (<section className="lovetype-section" key="sec12">
    <SectionBadge icon="🧪" label="사랑 유형 심리" />
    <h3>12. 사랑 유형 심리 검사</h3>
    <b>◼ 나의 연인이 마니아 유형이라면?</b>
    <p>
      마니아 유형의 사람들은 굉장히 민감하기 때문에 사소한 배려가 중요한 유형입니다.
      연락을 자주 해주거나 데이트 횟수 등을 최대한 노력해서 늘려주면 이들의 불안감을 진정시키는 효과가 있습니다.
      마니아 유형의 이런 특징은 관계가 깊어지고 안정될수록 이들의 마니아적 사랑의 모습은 점차 사라지고 안정적인 모습을 보이기 시작할 것입니다.
      만약 당신의 연인이 마니아 유형이라면, 지금 연인이 평소 표현하고 싶었던 속마음을 털어놓지 못하고 다른 방식으로 표현하고 있는 상태입니다.
      따라서 진지한 대화를 통해 상대의 이야기를 들어주고 해소해주면 훨씬 더 행복한 연애를 할 수 있게 됩니다.
    </p>
    <b>◼ 나의 연인이 프래그마 유형이라면?</b>
    <p>
      프래그마 유형의 가장 중요한 가치관은 '현실성'입니다. 이들은 항상 경제적인 가치를 중요시 여기기에 경제관념이 민감한 경우가 많습니다.
      이들은 로맨스를 즐기려고 하지만 현실적으로는 '나는 그러면 안 돼'라고 생각하기 때문에 스트레스를 겪고 있는 상태입니다.
      따라서 상대에게 내 모습을 멋지게 보여주고 싶다면 본인의 미래에 대해 잘 준비하고 계획하고 있다는 것을 보여주세요.
      다만 너무 비현실적인 것들은 역효과가 될 수 있습니다. 현실적으로 연인과 오랫동안 만나기 위해 이러한 준비를 하고 있고,
      꼭 결혼해서 행복하게 해줄 것이라는 비전을 보여주는 것이 이들의 마음을 더 사로잡을 수 있는 방법입니다.
    </p>
  </section>),
];

const hyeeunSections = [
  (<section className="lovetype-section" key="sec-empty">
    <div style={{color:'#b0b0b0',fontSize:'1.1rem'}}>페이지 내용은 곧 추가될 예정입니다 :)</div>
  </section>),
];

const LoveTypeDetail = ({ who }) => {
  usePageLogger(); 
  
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
