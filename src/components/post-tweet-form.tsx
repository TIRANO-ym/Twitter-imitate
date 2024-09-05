import { addDoc, collection, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import styled from "styled-components";
import { auth, db, storage } from "../firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import ErrorMessage from "./error-component";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TextArea = styled.textarea`
  border: 2px solid white;
  padding: 20px;
  border-radius: 20px;
  font-size: 16px;
  color: white;
  background-color: black;
  width: 100%;
  resize: none;
  font-family: var(--font-nanumfont);
  &::placeholder {
    font-size: 16px;
  }
  &: focus {
    outline: none;
    border-color: #1d9bf0;
  }
`;

const AttachFileButton = styled.label`
  padding: 10px 0px;
  color: #1d9bf0;
  text-align: center;
  border-radius: 20px;
  border: 1px solid #1d9bf0;
  font-size: 14px;
  // font-family: var(--font-nanumfontBold);
  font-weight: bold;
  cursor: pointer;
`;

const AttachFileInput = styled.input`
  display: none;
`;

const SubmitBtn = styled.input`
  background-color: #1d9bf0;
  color: white;
  border: none;
  padding: 10px 0px;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
  // font-family: var(--font-nanumfontBold);
  font-weight: bold;
  &:hover,
  &:active {
    opacity: 0.9;
  }
`;

export default function PostTweetForm() {
  const [isLoading, setLoading] = useState(false);
  const [tweet, setTweet] = useState("");
  const [file, setFile] = useState<File|null>(null);
  const [errMsg, setErrMsg] = useState('');

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTweet(e.target.value);
  }
  const onFilechange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrMsg('');
    const {files} = e.target;
    if(files && files.length === 1 && (files[0].size <= 2 * 1024 * 1024)) {
      setFile(files[0]);
    } else {
      setErrMsg('2MB 이하의 멋진 사진을 1개만 업로드해주세요!');
    }
  }
  const onSubmit = async (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrMsg('');
    const user = auth.currentUser;
    if (!user || isLoading) {
      return;
    } else if (!tweet || tweet.length > 180) {
      setErrMsg('180자 이하의 멋진 트윗을 입력해주세요!');
      return;
    }

    try {
      setLoading(true);
      const doc = await addDoc(collection(db, "tweets"), {
        tweet,
        createdAt: Date.now(),
        username: user.displayName || "Anonymous",
        userId: user.uid,
      });
      // 사진 업로드
      if (file) {
        const locationRef = ref(
          storage,
          `tweets/${user.uid}/${doc.id}`
        );
        const result = await uploadBytes(locationRef, file);
        const url = await getDownloadURL(result.ref);
        await updateDoc(doc, {
          photo: url
        });
      }
      setTweet('');
      setFile(null);
    } catch(e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form onSubmit={onSubmit}>
      <TextArea rows={5} maxLength={180} onChange={onChange} value={tweet} placeholder="What is happening?" />
      <AttachFileButton htmlFor="file">{file ? "Photo added ✅" : "Add photo"}</AttachFileButton>
      <AttachFileInput onChange={onFilechange} type="file" id="file" accept="image/*"/>
      <SubmitBtn type="submit" value={isLoading ? "Posting..." : "Post Tweet"}/>
      <ErrorMessage message={errMsg}/>
    </Form>
  );
}