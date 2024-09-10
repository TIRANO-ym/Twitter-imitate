import { ITweet } from "./timeline";
import { auth, db, storage } from "../firebase";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import Modal from "react-modal";
import React, { useState } from "react";
import useDetectClose from "../hooks/userDetectClose";
import { DeleteIcon, EditIcon } from "./icon-component";
import ErrorMessage from "./error-component";
import { AvatarImg, AvatarWrapper, Column, Li, LinkWrapper, Menu, ModalSubmitBtn, ModalWrapper, Payload, Photo, PhotoInput, PhotoUpload, ReactionBar, TextArea, Ul, Username, Wrapper, PostDateSpan } from "./tweet-component";
import { checkValidImage, checkValidTweet, resizeImageFile } from "./common-rule-component";
import moment from "moment";

/*
 * userId: 트윗 쓴 user id
 * id: 문서(doc) id
*/
export default function Tweet({ username, photo, tweet, userId, id, likes, userAvatarUrl, createdAt }: ITweet) {
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
    if (files && files.length) {
      let file = files[0];
      const checkRes = checkValidImage(file);
      if (checkRes.error) {
        setErrMsg(checkRes.error);
        return;
      }
      file = await resizeImageFile(file);
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
    const checkText = checkValidTweet(editText);
    if (checkText.error) {
      setErrMsg(checkText.error);
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
          <PostDate createdAt={createdAt}/>
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

function PostDate({ createdAt }: { createdAt: number }) {
  let diff = moment().diff(moment(createdAt), 'minute');
  let unit = 'minutes';
  let result = 'just now';
  if (diff > 0) {
    if (diff > 60) {
      diff = diff / 60;
      unit = 'hours';
      if (diff > 24) {
        diff = diff / 24;
        unit = 'days';
        if (diff > 30) {
          diff = diff / 30;
          unit = 'months';
          if (diff > 12) {
            diff = diff / 12;
            unit = 'years';
          }
        }
      }
    }
    result = `${Math.round(diff)} ${unit} ago`;
  }
  return (
    <PostDateSpan>{result}</PostDateSpan>
  );
}