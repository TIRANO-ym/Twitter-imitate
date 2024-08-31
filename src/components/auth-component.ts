import styled from "styled-components";

export const firebaseErrorMessage: any = {
  "auth/email-already-in-use": "이미 사용 중인 이메일입니다.",
  "auth/invalid-login-credentials": "이메일 또는 비밀번호가 일치하지 않습니다.",
  "auth/account-exists-with-different-credential": "이미 존재하는 이메일입니다. 이메일로 로그인해주세요."
};

export const Wrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 420px;
  padding: 50px 0px;
`;

export const Title = styled.h1`
  font-size: 42px;
  display: inline-flex;
  img {
    margin-left: 20px;
    height: 42px;
  }
`;

export const Form = styled.form`
  margin-top: 50px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

export const Input = styled.input`
  padding: 10px 20px;
  border-radius: 50px;
  border: none;
  width: 100%;
  font-size: 16px;
  &[type="submit"] {
    cursor: pointer;
    font-weight: bold;
    background-color: #1d9bf0;
    color: white;
    &:hover {
      opacity: 0.8;
    }
  }
`;

export const Error = styled.span`
  font-weight: 500;
  color: tomato;
`;

export const Switcher = styled.span`
  margin-top: 20px;
  a {
    color: #1d9bf0;
  }
`;