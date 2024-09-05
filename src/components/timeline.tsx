import { collection, getDocs, limit, onSnapshot, orderBy, query } from "firebase/firestore";
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

const LoadMore = styled.div`
  width: 100%;
  color: #1d9bf0;
  text-align: center;
  cursor: pointer;
  &:hover {
    font-weight: bold;
    text-decoration : underline;
  }
`;
const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;
const Loading = styled.div`
  width: 25px;
  padding: 5px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #1d9bf0;
  --_m: 
    conic-gradient(#0000 10%,#000),
    linear-gradient(#000 0 0) content-box;
  -webkit-mask: var(--_m);
          mask: var(--_m);
  -webkit-mask-composite: source-out;
          mask-composite: subtract;
  animation: l3 1s infinite linear;
  @keyframes l3 {to{transform: rotate(1turn)}}
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

      // 트윗 요청 쿼리
      const tweetsQuery = query(
        collection(db, "tweets"),
        orderBy("createdAt", "desc"),
        limit(limitCnt)
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