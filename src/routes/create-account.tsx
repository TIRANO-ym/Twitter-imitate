import React, { useState } from "react";
import ticon from "../assets/images/twitter_icon.jpg";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { firebaseErrorMessage, Wrapper, Title, Input, Switcher, Error, Form } from "../components/auth-component";
import GithubButton from "../components/github-btn";
import { doc, setDoc } from "firebase/firestore";

const initialValue = { name: '', email: '', password: '' };

export default function CreateAccount() {
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [inputValues, setInputValues] = useState(initialValue);
  const { name, email, password } = inputValues;

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target: {name, value} } = e;
    setInputValues({ ...inputValues, [name]: value });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (isLoading || !name || !email || !password) {
      return;
    }

    try {
      setLoading(true);
      const credentials = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(credentials.user, {
        displayName: name
      });

      // users doc에 추가
      await setDoc(doc(db, "users", credentials.user.uid), {
        userName: name,
        photoUrl: ''
      });

      navigate("/");
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.log(e);
        setError(firebaseErrorMessage[e.code] ? firebaseErrorMessage[e.code] : e.code);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Wrapper>
      <Title>Join <img src={ticon}/></Title>
      <Form onSubmit={onSubmit}>
        <Input 
          onChange={onChange}
          name="name" 
          value={name} 
          placeholder="Name" 
          type="text" 
          required
        />
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
          value={ isLoading ? "Loading" : "Create Account" }
        />
      </Form>
      { error ? <Error>{error}</Error> : null }
      <Switcher>
        Already have an account? <Link to="/login">Log in &rarr;</Link>
      </Switcher>
      <GithubButton />
    </Wrapper>
  )
}