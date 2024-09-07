import styled from "styled-components";
import { ITweet } from "./timeline";
import { auth, db, storage } from "../firebase";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import Modal from "react-modal";
import React, { useState } from "react";
import useDetectClose from "../hooks/userDetectClose";
import { DeleteIcon, EditIcon } from "./icon-component";
import ErrorMessage from "./error-component";

const Wrapper = styled.div`
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

const Column = styled.div``;

const Photo = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 15px;
`;

const AvatarWrapper = styled.div`
  overflow: hidden;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #1d9bf0;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const AvatarImg = styled.img`
  width: 100%;
`;
const Username = styled.span`
  font-size: 15px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
  svg {
    width: 15px;
  }
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
  margin-bottom: 20px;
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

const ReactionBar = styled.div`
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

/*
 * userId: 트윗 쓴 user id
 * id: 문서(doc) id
*/
export default function Tweet({ username, photo, tweet, userId, id, likes, userAvatarUrl }: ITweet) {
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
      console.log(e);
      alert(e);
    } finally {

    }
  };

  // -------------- 트윗 수정 모달 --------------
  const [isModalOpen, setModalOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const openModal = () => {
    setEditText(tweet);
    setModalOpen(true);
  };
  const closeModal = () => {
    if (isUpdating) return;
    setModalOpen(false);
    setEditPhoto(null);
    setEditPhotoUrl('');
    setDeletePhoto(false);
    setErrMsg('');
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
      padding: "40px",
      paddingBottom: "20px",
      left: "13%"
    }
  };
  // 트윗 수정 - 텍스트
  const onEditTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value);
  };
  // 트윗 수정 - 이미지 첨부
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [deletePhoto, setDeletePhoto] = useState(false);
  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const {files} = e.target;
    if (!user) return;
    if (files && files.length === 1 && (files[0].size <= 2 * 1024 * 1024)) {
      const file = files[0];
      setEditPhoto(file);
      // 임시 파일 url 지정
      if (FileReader) {
        var fr = new FileReader();
        fr.onload = () => {
          setDeletePhoto(false);
          setErrMsg('');
          setEditPhotoUrl(`${fr.result}`);
        };
        fr.readAsDataURL(file);
      }
    } else if (!(files && files.length === 0)) {
      setErrMsg('2MB 이하의 멋진 사진을 1개만 업로드해주세요!');
    }
  };
  // 트윗 수정 - 이미지 삭제
  const onPhotoDelete = (e: React.ChangeEvent) => {
    e.preventDefault();
    setEditPhoto(null);
    setEditPhotoUrl('');
    setDeletePhoto(true);
  };
  // 트윗 수정 모달 - 최종 Update 클릭
  const onEdit = async() => {
    if (isUpdating) return;
    if (!editText || editText.length > 180) {
      setErrMsg('180자 이하의 멋진 트윗을 입력해주세요!');
      return;
    }
    setIsUpdating(true);
    // 텍스트 update
    const tweetRef = doc(db, "tweets", id);
    await updateDoc(tweetRef, {
      tweet: editText
    });
    // 이미지 수정됐으면 수정 (upsert)
    if (editPhoto) {
      const locationRef = ref(
        storage,
        `tweets/${userId}/${id}`
      );
      const result = await uploadBytes(locationRef, editPhoto);
      const url = await getDownloadURL(result.ref);
      await updateDoc(tweetRef, {
        photo: url
      });
    }
    // 이미지 삭제
    else if (deletePhoto && photo) {
      const photoRef = ref(storage, `tweets/${userId}/${id}`);
      await deleteObject(photoRef);
      await updateDoc(tweetRef, {
        photo: null
      });
    }
    
    setModalOpen(false);
    setIsUpdating(false);
    setEditPhoto(null);
    setErrMsg('');
  }
  // ----------------------------
  
  // -------------- 좋아요 --------------
  const [likeFlag, setLikeFlag] = useState(user ? likes.includes(user.uid) : false);
  const onLikeClick = async() => {
    if (user) {
      const tweetRef = doc(db, "tweets", id);
      if (likeFlag) {
        // 좋아요 삭제
        await updateDoc(tweetRef, {
          likes: likes.filter(v => v !== user.uid)
        });
        setLikeFlag(false);
      } else {
        // 좋아요 추가
        await updateDoc(tweetRef, {
          likes: [...likes, user.uid]
        });
        setLikeFlag(true);
      }
    }
  }

  return (
    <Wrapper>
      <Column>
        <Username>
          <AvatarWrapper>{ userAvatarUrl 
            ? <AvatarImg src={userAvatarUrl}/>
            : <svg fill="white" strokeWidth={1.5} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
          }</AvatarWrapper>
          {username}
        </Username>
        <Payload>{tweet}</Payload>
        <Modal isOpen={isModalOpen} onAfterClose={closeModal} onRequestClose={closeModal} style={modalStyles}>
          <ModalWrapper>
            <Column>
              <TextArea maxLength={180} onChange={onEditTextChange} value={editText}/>
            </Column>
            <Column>
              <PhotoUpload htmlFor="photo">
                <div className="phoho-edit-options">
                  <EditIcon/> <DeleteIcon onClick={onPhotoDelete}/>
                </div>
                {(!deletePhoto && (editPhoto || photo)) ? (
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
          <ErrorMessage message={errMsg}/>
          <ModalSubmitBtn>
            <button className="update" onClick={onEdit}>{isUpdating ? 'Uploading...' : 'Update'}</button>
            <button className="cancel" onClick={closeModal}>Cancel</button>
          </ModalSubmitBtn>
        </Modal>
      </Column>
      <Column style={{ alignContent: 'center' }}>
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
                    <a>Edit Tweet</a> <EditIcon/>
                  </LinkWrapper>
                </Li>
                <Li>
                  <LinkWrapper onClick={onDelete} style={{color: 'tomato'}}>
                    <a>Delete Tweet</a> <DeleteIcon/>
                  </LinkWrapper>
                </Li>
              </Ul>
            </Menu> : null}
          </>
        ): null }
      </Column>
      <ReactionBar>
        <span className="like">
          <svg onClick={onLikeClick} fill={likeFlag ? 'tomato' : 'none'} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path stroke={likeFlag ? 'none' : 'white'} strokeWidth="2" d="m9.653 16.915-.005-.003-.019-.01a20.759 20.759 0 0 1-1.162-.682 22.045 22.045 0 0 1-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 0 1 8-2.828A4.5 4.5 0 0 1 18 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 0 1-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 0 1-.69.001l-.002-.001Z" />
          </svg>
          { likes.length }
        </span>
      </ReactionBar>
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
  transform: translate(-60%, 5%);
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