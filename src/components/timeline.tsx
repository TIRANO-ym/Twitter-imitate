import { collection, getDocs, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { db } from "../firebase";
import Tweet from "./tweet";
import { Unsubscribe } from "firebase/auth";
import { Loading, LoadingWrapper, LoadMore } from "./tweet-component";

export interface ITweet {
  id: string;
  photo?: string;
  tweet: string;
  userId: string;
  username: string;
  createdAt: number;
  userAvatarUrl?: string;
  likes: string[];
}

const Wrapper = styled.div`
  display: flex;
  gap: 10px;
  flex-direction: column;
  overflow-y: scroll;
`;

export default function Timeline() {
  const [tweets, setTweet] = useState<ITweet[]>([]);
  const [limitCnt, setLimitCnt] = useState(25);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [allTweetCnt, setAllTweetCnt] = useState(0);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    const fetchTweets = async() => {
      // 전체 카운트
      const cntQuery = query(collection(db, "tweets"));
      const snapshotForAllCnt = await getDocs(cntQuery);
      setAllTweetCnt(snapshotForAllCnt.size);

      // 전체 사용자 목록
      const usersQuery = query(collection(db, "users"));
      const snapshotForUsers = await getDocs(usersQuery);
      let allUsers: any = {};
      snapshotForUsers.docs.forEach((doc) => {
        allUsers[`${doc.id}`] = doc.data();
      });

      // 트윗 요청 쿼리
      const tweetsQuery = query(
        collection(db, "tweets"),
        orderBy("createdAt", "desc"),
        limit(limitCnt)
      );
  
      // 트윗 변경사항 구독 (리스너 추가)
      unsubscribe = await onSnapshot(tweetsQuery, (snapshot) => {
        const tweets = snapshot.docs.map(doc => {
          const {tweet, createdAt, userId, username, photo, likes} = doc.data();
          return {
            tweet,
            createdAt,
            userId,
            username,
            photo,
            likes: likes || [],
            id: doc.id,
            userAvatarUrl: allUsers[userId].photoUrl
          };
        });
        setTweet(tweets);
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
  }

  return (
    <Wrapper>
      {
        tweets.map((tweet) => {
          return <Tweet key={tweet.id} {...tweet} />;
        })
      }
      {
        (limitCnt < allTweetCnt) ? (
          isAddLoading 
            ? <LoadingWrapper><Loading/></LoadingWrapper> 
            : <LoadMore onClick={onClickAddLimit}>Load more...</LoadMore>
        ) : null
      }
    </Wrapper>
  );
}