import React, { useState } from "react";
import ticon from "../images/twitter_icon.jpg";
import { Link, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { firebaseErrorMessage, Input, Switcher, Title, Wrapper, Error, Form } from "../components/auth-component";
import GithubButton from "../components/github-btn";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target: {name, value} } = e;
    if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    } 
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (isLoading || !email || !password) {
      return;
    }

    try {
      setLoading(true);
      // 로그인
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.log(e);
        setError(firebaseErrorMessage[e.code] ? firebaseErrorMessage[e.code] : e.code);
      }
    } finally {
      setLoading(false);
    }
    
    console.log(name, email, password);
  }

  return (
    <Wrapper>
      <Title>Log into <img src={ticon}/></Title>
      <Form onSubmit={onSubmit}>
        <Input 
          onChange={onChange}
          name="email" 
          value={email} 
          placeholder="Email" 
          type="email" 
          required
        />
        <Input 
          onChange={onChange}
          name="password" 
          value={password} 
          placeholder="Password" 
          type="password" 
          required
        />
        <Input 
          onChange={onChange}
          type="submit" 
          value={ isLoading ? "Loading" : "Log in" }
        />
      </Form>
      { error ? <Error>{error}</Error> : null }
      <Switcher>
        Don't have an account? <Link to="/create-account">Create one &rarr;</Link>
      </Switcher>
      <GithubButton />
    </Wrapper>
  )
}