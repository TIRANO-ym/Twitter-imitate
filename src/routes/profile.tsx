import styled from "styled-components";
import { auth, db, storage } from "../firebase"
import React, { useEffect, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Unsubscribe, updateProfile } from "firebase/auth";
import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { ITweet } from "../components/timeline";
import Tweet from "../components/tweet";
import { DeleteIcon, EditIcon } from "../components/icon-component";
import ErrorMessage from "../components/error-component";
import { checkValidUserName } from "../components/common-rule-component";
import { Loading, LoadingWrapper, LoadMore } from "../components/tweet-component";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 20px;
  // height: 100%;
  overflow-y: hidden;
`;
const AvatarUpload = styled.label`
  overflow: hidden;
  width: 180px;
  min-height: 180px;
  border-radius: 50%;
  background-color: #1d9bf0;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  .phoho-edit-options {
    display: none;
    justify-content: space-around;
    background-color: #00000090;
    position: absolute;
    width: 100%;
    height: 100%;
    padding: 5px;
    svg {
      width: 60px;
    }
    svg:hover {
      opacity: 0.8;
    }
  }
  svg {
    width: 50%;
  }
  &:hover {
    .phoho-edit-options {
      display: flex !important;
    }
  }
`;
const AvatarImg = styled.img`
  width: 100%;
`;
const AvatarInput = styled.input`
  display: none;
`;
const Tweets = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: scroll;
`;

const NameWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 30px;
  svg {
    height: 100%;
    cursor: pointer;
  }
`;
const Name = styled.span`
  font-size: 22px;
  margin-right: 10px;
`;
const EditNameInput = styled.input`
  font-size: 22px;
  width: 250px;
  margin-right: 10px;
  background-color: rgba(0, 0, 0, 1);
  border: 1px solid gray;
  border-radius: 5px;
  color: white;
  text-align: center;
`;

export default function Profile() {
  const user = auth.currentUser;
  const [errMsg, setErrMsg] = useState('');

  // 프로필 이미지 변경
  const [avatar, setAvatar] = useState(user?.photoURL);
  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const {files} = e.target;
    if (!user) return;
    if (files && files.length === 1) {
      const file = files[0];
      const locationRef = ref(storage, `avatars/${user.uid}`);
      const result = await uploadBytes(locationRef, file);
      const avatarUrl = await getDownloadURL(result.ref);
      setAvatar(avatarUrl);
      await updateProfile(user, {
        photoURL: avatarUrl
      });

      // users doc에도 업데이트
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        photoUrl: avatarUrl
      });
    }
  };
  // 프로필 이미지 삭제
  const onAvatarDelete = async (e: React.ChangeEvent) => {
    e.preventDefault();
    const ok = confirm("Are you sure you want to delete your avatar?");
    if (!ok || !user) return;
    await updateProfile(user, {
      photoURL: ""
    });
    setAvatar(null);

    // users doc에도 업데이트
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      photoUrl: ''
    });
  }

  // 본인의 트윗들만 가져오기
  const [tweets, setTweets] = useState<ITweet[]>([]);
  const [limitCnt, setLimitCnt] = useState(25);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [allTweetCnt, setAllTweetCnt] = useState(0);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    const fetchTweets = async() => {
      // 전체 카운트
      const cntQuery = query(
        collection(db, "tweets"),
        where("userId", "==", user?.uid)
      );
      const snapshotForAllCnt = await getDocs(cntQuery);
      setAllTweetCnt(snapshotForAllCnt.size);

      // 트윗 요청 쿼리
      const tweetQuery = query(
        collection(db, "tweets"),
        where("userId", "==", user?.uid),
        orderBy("createdAt", "desc"),
        limit(limitCnt)
      );

      // 트윗 구독 (리스너)
      unsubscribe = await onSnapshot(tweetQuery, (snapshot) => {
        const tweets = snapshot.docs.map(doc => {
          const {tweet, createdAt, userId, username, photo, likes} = doc.data();
          return {
            tweet,
            createdAt,
            userId,
            username,
            photo,
            likes: likes || [],
            userAvatarUrl: user?.photoURL || '',
            id: doc.id
          };
        });
        setTweets(tweets);
        setIsAddLoading(false);
      });
    };
    fetchTweets();

    // 안보거나 종료 시 구독 취소 (+ Load more 클릭 시 리렌더링되면서 기존 구독사항도 종료된다.)
    return () => {
      unsubscribe && unsubscribe();
    }
  }, [limitCnt]);
  const onClickAddLimit = () => {
    setIsAddLoading(true);
    setLimitCnt(prev => prev + 25);
  };

  // 닉네임 변경
  const [showInput, setShowInput] = useState(false);
  const [username, setUsername] = useState(user?.displayName ?? "Anonymous");
  const [inputedName, setInputedName] = useState(username);
  const [isUpdating, setIsUpdating] = useState(false);
  const clickEditName = () => {
    setShowInput(true);
  }
  const onInputChange = (e: any) => {
    setInputedName(e.target.value);
  };
  const onSubmit = async() => {
    if (isUpdating || !user) {
      return;
    }
    const checkName = checkValidUserName(inputedName);
    if (checkName.error) {
      setErrMsg(checkName.error);
      return;
    }
    setErrMsg('');
    // displayname 업데이트
    setIsUpdating(true);
    await updateProfile(user, { displayName: inputedName });
    setUsername(inputedName);
    setShowInput(false);
    setIsUpdating(false);

    // users doc에도 업데이트
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      userName: inputedName
    });
  }
  const onCancel = () => {
    if (isUpdating) return;
    setShowInput(false);
    setInputedName(username);
    setErrMsg('');
  }

  return (
    <Wrapper>
      <AvatarUpload htmlFor="avatar">
        <div className="phoho-edit-options">
          <EditIcon/> <DeleteIcon onClick={onAvatarDelete}/>
        </div>
        {Boolean(avatar) ? (
          <AvatarImg src={`${avatar}`} />
        ) : (
          <svg fill="white" strokeWidth={1.5} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        )}
      </AvatarUpload>
      <AvatarInput
        onChange={onAvatarChange} 
        id="avatar" 
        type="file" 
        accept="image/*" 
      />
      {
        showInput ? (
          <NameWrapper>
            <EditNameInput type="text" value={inputedName} onChange={onInputChange}/>
            {
              isUpdating
              ? <svg style={{fill:"rgb(13, 138, 75)", cursor: "default"}} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8.5 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM15.5 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
              </svg> 
              : <svg onClick={onSubmit} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path clipRule="evenodd" fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" />
              </svg>
            }
            <svg onClick={onCancel} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </NameWrapper>
        )
        : <NameWrapper>
            <Name>{username}</Name>
            <svg onClick={clickEditName} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.419a4 4 0 0 0-.885 1.343Z" />
            </svg>
          </NameWrapper>
      }
      <ErrorMessage message={errMsg}/>
      <Tweets>
        {tweets.map(tweet => <Tweet key={tweet.id} {...tweet}></Tweet>)}
        {
          (limitCnt < allTweetCnt) ? (
            isAddLoading 
              ? <LoadingWrapper><Loading/></LoadingWrapper> 
              : <LoadMore onClick={onClickAddLimit}>Load more...</LoadMore>
          ) : null
        }
      </Tweets>
    </Wrapper>
  )
}