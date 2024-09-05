import styled from "styled-components";

const ErrMsg = styled.div`
  // font-weight: bold;
  font-size: 0.9rem;
  color: tomato;
  width: 100%;
  text-align: center;
`;

export default function ErrorMessage(props: { message?: string }) {
  return (
    <>{
      props.message
      ? <ErrMsg>{props.message}</ErrMsg>
      : null
    }</>
  );
}