import styled from "styled-components";
import { ITweet } from "./timeline";
import { auth, db, storage } from "../firebase";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import Modal from "react-modal";
import React, { useState } from "react";
import useDetectClose from "../hooks/userDetectClose";

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 6fr 1fr 0.5fr;
  padding: 20px;
  border: 1px solid #ffffff80;
  border-radius: 15px;
  .dropdown-menu {
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

const Column = styled.div``;

const Photo = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 15px;
`;

const Username = styled.span`
  font-size: 15px;
  font-weight: bold;
`;

const Payload = styled.p`
  margin: 10px 0px;
  font-size: 18px;
`;

const ModalWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr fit-content(100%);
  gap: 10px;
  width: 100%;
`;
const TextArea = styled.textarea`
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
const PhotoUpload = styled.label`
  width: 100px;
  overflow: hidden;
  height: 100px;
  border-radius: 15px;
  background-color: #ffffff50;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    width: 100px;
  }
  &:hover {
    opacity: 0.9;
  }
`;
const PhotoInput = styled.input`
  display: none;
`;
const ModalSubmitBtn = styled.div`
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

/*
 * userId: 트윗 쓴 user id
 * id: 문서(doc) id
*/
export default function Tweet({ username, photo, tweet, userId, id }: ITweet) {
  const user = auth.currentUser;

  // 드롭다운 메뉴 구성
  const [dropDownIsOpen, menuRef, menuHandler] = useDetectClose(false);

  // 트윗 삭제
  const onDelete = async() => {
    const ok = confirm("Are you sure you want to delete this tweet?");
    if (!ok || (user?.uid !== userId)) return;
    try {
      await deleteDoc(doc(db, "tweets", id));
      if (photo) {
        const photoRef = ref(storage, `tweets/${userId}/${id}`);
        await deleteObject(photoRef);
      }
    } catch (e) {
      console.log(e);   // todo: 적절한 에러메시지 보여주기
    } finally {

    }
  };

  // 트윗 수정 - 텍스트
  const [isModalOpen, setModalOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const openModal = () => {
    setEditText(tweet);
    setModalOpen(true);
  };
  const closeModal = () => {
    if (isUpdating) return;
    setModalOpen(false);
    setEditPhoto(null);
    setEditPhotoUrl('');
  };
  const modalStyles = {
    overlay: {
      backgroundColor: "#000000b3",
    },
    content: {
      backgroundColor: "black",
      minWidth: "300px",
      width: "35%",
      height: "fit-content",
      margin: "auto",
      border: "1px solid gray",
      borderRadius: "10px",
      padding: "20px"
    }
  };
  const onEditTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value);
  };
  // 트윗 수정 - 이미지
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  // todo: 사진 삭제 기능 (화면을 어떻게...)
  const [deletePhoto, setDeletePhoto] = useState(false);
  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const {files} = e.target;
    if (!user) return;
    if (files && files.length === 1) {
      const file = files[0];
      setEditPhoto(file);
      // 임시 파일 url 지정
      if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = () => {
          setEditPhotoUrl(`${fr.result}`);
        };
        fr.readAsDataURL(file);
      }
    }
  };
  const onEdit = async() => {
    if (isUpdating || !editText) return;
    setIsUpdating(true);
    // 트윗 수정
    const tweetRef = doc(db, "tweets", id);
    await updateDoc(tweetRef, {
      tweet: editText
    });
    // 사진 수정됐으면 수정
    if (editPhoto) {
      const locationRef = ref(
        storage,
        `tweets/${userId}-${username}/${id}`
      );
      const result = await uploadBytes(locationRef, editPhoto);
      const url = await getDownloadURL(result.ref);
      await updateDoc(tweetRef, {
        photo: url
      });
    }
    else if (deletePhoto) {
      
    }
    
    setModalOpen(false);
    setIsUpdating(false);
    setEditPhoto(null);
  }

  return (
    <Wrapper>
      <Column>
        <Username>{username}</Username>
        <Payload>{tweet}</Payload>
        <Modal isOpen={isModalOpen} onRequestClose={closeModal} style={modalStyles}>
          <ModalWrapper>
            <Column>
              <TextArea maxLength={180} onChange={onEditTextChange} value={editText}/>
            </Column>
            <Column>
              <PhotoUpload htmlFor="photo">
                {(editPhoto || photo) ? (
                  <Photo src={(editPhotoUrl || photo)} />
                ) : (
                  <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path clipRule="evenodd" fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                  </svg>
                )}
              </PhotoUpload>
              <PhotoInput
                onChange={onPhotoChange} 
                id="photo" 
                type="file" 
                accept="image/*" 
              />
            </Column>
          </ModalWrapper>
          <ModalSubmitBtn>
            <button className="update" onClick={onEdit}>{isUpdating ? 'Uploading...' : 'Update'}</button>
            <button className="cancel" onClick={closeModal}>Cancel</button>
          </ModalSubmitBtn>
        </Modal>
      </Column>
      <Column>
        {photo ? (
          <Photo src={photo} />
        ) : null}
      </Column>
      <Column className="dropdown-menu">
        { (user?.uid === userId) ? (
          <>
            <svg onClick={menuHandler} ref={menuRef} className="menu-button" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.5 15.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
            </svg>
            {dropDownIsOpen ?
            <Menu>
              <Ul>
                <Li>
                  <LinkWrapper onClick={openModal}>
                    <a>Edit Tweet</a> <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path clipRule="evenodd" fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  </LinkWrapper>
                </Li>
                <Li>
                  <LinkWrapper onClick={onDelete} style={{color: 'tomato'}}>
                    <a>Delete Tweet</a> <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path clipRule="evenodd" fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" />
                    </svg>
                  </LinkWrapper>
                </Li>
              </Ul>
            </Menu> : null}
          </>
        ): null }
      </Column>
    </Wrapper>
  );
}

// 드롭다운 메뉴
const Menu = styled.div`
  background: #000000ee;
  position: absolute;
  text-align: center;
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.2);
  border: 1px solid gray;
  border-radius: 3px;
  opacity: 1;
  visibility: visible;
  transform: translate(-35%, 5%);
  z-index: 9;
}
`;
const Ul = styled.ul`
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
const Li = styled.li``;
const LinkWrapper = styled.a`
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