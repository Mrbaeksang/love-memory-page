import React from "react";
import "./Profile.css";

const myProfile = {
  name: "상현",
  intro: "따뜻하고 감성적인 남자친구!",
  message: "항상 곁에 있어줘서 고마워. 앞으로도 행복하자!",
};

const gfProfile = {
  name: "여자친구",
  intro: "밝고 사랑스러운 여자친구!",
  message: "너와 함께라서 매일이 설레고 행복해!",
};

const Profile = () => {
  return (
    <div className="profile-container">
      <h2>서로에 대한 소개</h2>
      <div className="profile-cards">
        <div className="profile-card">
          <h3>{myProfile.name}</h3>
          <p>{myProfile.intro}</p>
          <p className="profile-message">"{myProfile.message}"</p>
        </div>
        <div className="profile-card">
          <h3>{gfProfile.name}</h3>
          <p>{gfProfile.intro}</p>
          <p className="profile-message">"{gfProfile.message}"</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
