export const checkValidImage = (file: File): { error?: string } => {
  // if (file.size > 2 * 1024 * 1024) {
  //   return { error: '2MB 이하의 멋진 사진을 업로드해주세요!' };
  // } else 
  if (file.type.split('/')[0] !== 'image') { 
    return { error: '2MB 이하의 멋진 "사진"(이미지 파일)을 업로드해주세요!' };
  }
  return {};
}

export const checkValidTweet = (txt: string): { error?: string } => {
  if (!txt || txt.length > 180) {
    return { error: '180자 이하의 멋진 트윗을 입력해주세요!' };
  }
  return {};
}

export const checkValidUserName = (name: string): { error?: string } => {
  if (!name || name.length > 20) {
    return { error: '20자 이하의 멋진 이름을 입력해주세요!' };
  }
  return {};
}

export const resizeImageFile = (file: File): Promise<File> => {
  // for test
  // return new Promise((resolve) => {
  //   resolve(file);
  // });

  // 2MB 이하면 그냥 첨부
  if (file.size <= 2 * 1024 * 1024) {
    return new Promise((resolve) => {
      resolve(file);
    });
  }

  const width = 300;  // 기준 사이즈. 가로세로 300px (100으로 딱맞추면 화질구지)
  const height = 300;
  
  // GIF: TODO: 별도 라이브러리로 압축
  if (file.type === 'image/gif') {
    return new Promise((resolve) => {
      resolve(file);
      // gifResize({ width: width, height: height })().then((data: any) => {
      //   console.log(data);
      //   resolve(data);
      // });
    });
  }
  // 기타 이미지: canvas 활용하여 압축
  else {
    return new Promise<File>((resolve) => {
      const fileReader = new FileReader();
      fileReader.onload = async () => {
        const _IMG = new Image();
        _IMG.src = `${fileReader.result}`;
        _IMG.onload = () => {
          // canvas에 이미지 그려서 리사이징
          let canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (context) {
            context.drawImage(_IMG, 0, 0, width, height);
          }
        
          // canvas의 dataurl를 blob(file)화
          let dataURL = canvas.toDataURL(file.type);    // 원하면 png => jpg 등으로 변환 가능
          let byteString = atob(dataURL.split(',')[1]);
          let mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
          let ab = new ArrayBuffer(byteString.length);
          let ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
        
          let resultFile = new Blob([ab], {type: mimeString});
          resolve(new File([resultFile], file.name));
        };
      };
      fileReader.readAsDataURL(file);
    });
  }
}