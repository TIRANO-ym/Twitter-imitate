import styled from "styled-components";

export const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 6fr 1fr 0.5fr;
  padding: 20px;
  border: 1px solid #ffffff80;
  border-radius: 15px;
  .dropdown-menu {
    position: relative;
    text-align: right;
    .menu-button {
      width: 30px;
      cursor: pointer;
    }
  }
  .dropdown-menu:hover {
    .menu-button {
      opacity: 0.8;
    }
  }
`;

export const Column = styled.div``;

export const Photo = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 15px;
`;

export const AvatarWrapper = styled.div`
  overflow: hidden;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #1d9bf0;
  display: flex;
  justify-content: center;
  align-items: center;
`;
export const AvatarImg = styled.img`
  width: 100%;
`;
export const Username = styled.span`
  font-size: 15px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
  svg {
    width: 15px;
  }
`;

export const Payload = styled.p`
  margin: 10px 0px;
  font-size: 18px;
`;

export const ModalWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr fit-content(100%);
  gap: 10px;
  width: 100%;
  margin-bottom: 20px;
`;
export const TextArea = styled.textarea`
  border: 2px solid white;
  padding: 20px;
  border-radius: 20px;
  font-size: 16px;
  color: white;
  background-color: black;
  width: 100%;
  height: 100%;
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
export const PhotoUpload = styled.label`
  width: 100px;
  overflow: hidden;
  height: 100px;
  border-radius: 15px;
  background-color: #ffffff50;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  .phoho-edit-options {
    display: none;
    background-color: #00000090;
    position: absolute;
    width: 100%;
    height: 100%;
    padding: 5px;
    svg:hover {
      opacity: 0.8;
    }
  }
  svg {
    width: 100px;
  }
  &:hover {
    .phoho-edit-options {
      display: flex !important;
    }
  }
`;
export const PhotoInput = styled.input`
  display: none;
`;
export const ModalSubmitBtn = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 5px;
  width: 100%;
  justify-content: right;
  button {
    border: none;
    font-size: 16px;
    padding: 4px 10px;
    border-radius: 20px;
    cursor: pointer;
    &:hover,
    &:active {
      opacity: 0.9;
    }
  }
  .update {
    background-color: #1d9bf0;
    color: white;
    font-weight: bold;
  }
`;

export const ReactionBar = styled.div`
  width: 100%;
  display: flex;
  .like {
    display: flex;
    align-items: center;
    gap: 5px;
    svg {
      width: 20px;
      cursor: pointer;
    }
    svg:hover {
      opacity: 0.9;
    }
  }
`;

// 드롭다운 메뉴
export const Menu = styled.div`
  background: #000000ee;
  position: absolute;
  text-align: center;
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.2);
  border: 1px solid gray;
  border-radius: 3px;
  opacity: 1;
  visibility: visible;
  transform: translate(-60%, 5%);
  z-index: 9;
}
`;
export const Ul = styled.ul`
  & > li {
    margin-bottom: 10px;
  }

  & > li:first-of-type {
    margin-top: 10px;
  }

  & > li:hover {
    opacity: 0.9;
  }

  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
`;
export const Li = styled.li``;
export const LinkWrapper = styled.a`
  font-size: 16px;
  text-decoration: none;
  color: white;
  display: flex;
  padding: 0px 10px;
  align-items: center;
  cursor: pointer;
  a {
    width: 100px;
  }
  svg {
    margin-left: 5px;
    height: 20px;
  }
  &:hover {
    opacity: 0.9;
  }
`;