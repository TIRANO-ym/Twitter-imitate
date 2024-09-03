import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { db } from "../firebase";
import Tweet from "./tweet";
import { Unsubscribe } from "firebase/auth";

export interface ITweet {
  id: string;
  photo?: string;
  tweet: string;
  userId: string;
  username: string;
  createdAt: number;
  userAvatarUrl?: string;
}

const Wrapper = styled.div`
  display: flex;
  gap: 10px;
  flex-direction: column;
  overflow-y: scroll;
`;

export default function Timeline() {
  const [tweets, setTweet] = useState<ITweet[]>([]);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    const fetchTweets = async() => {
      // 트윗 요청 쿼리
      // todo: 25개 이상 추가 로드 옵션 (더보기 혹은 스크롤 액션)
      const tweetsQuery = query(
        collection(db, "tweets"),
        orderBy("createdAt", "desc"),
        limit(25)
      );
  
      // 트윗 변경사항 구독 (리스너 추가)
      unsubscribe = await onSnapshot(tweetsQuery, (snapshot) => {
        const tweets = snapshot.docs.map(doc => {
          const {tweet, createdAt, userId, username, photo} = doc.data();
          return {
            tweet,
            createdAt,
            userId,
            username,
            photo,
            id: doc.id
          };
        });
        setTweet(tweets);
      });
    };
    fetchTweets();

    // 안보거나 종료 시 구독 취소
    return () => {
      unsubscribe && unsubscribe();
    }
  }, []);

  return (
    <Wrapper>
      {
        tweets.map((tweet) => {
          return <Tweet key={tweet.id} {...tweet} />;
        })
      }
    </Wrapper>
  );
}