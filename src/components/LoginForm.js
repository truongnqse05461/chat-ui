import React, { Component } from "react";

import FormInputs from "./FormInputs";

import MessageContainer from "./MessageContainer";

import Joi, { isBuffer } from "joi-browser";
import axios from "axios";
import '../form.css'
import { array } from "prop-types";
import factoryWithThrowingShims from "prop-types/factoryWithThrowingShims";
import fileDownload from 'js-file-download';
import ChatContainer from "./ChatContainer";


var ws = undefined;

class LoginForm extends Component {

  constructor() {
    super();
    let authenticated = false
    let username = ""
    if (localStorage.getItem("token") != null) {
      authenticated = true
      username = localStorage.getItem("username");
    }
    this.state = {
      username: username,
      password: "",
      errors: {},
      submitSuccessfully: false,
      authenticated: authenticated,
      inRoom: true,
      roomName: "",
      messages: [],
      inputMessage: "",
      viewRegister: false,
      image: "",
      avatarPath: "",
      fileUpload: "",
      listRoom: [],
      currentRoom: "",
      currentRoomIndex: 0,
      listMembers: [],
      currentRoomObj: {},
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.validate = this.validate.bind(this);
    this.validateOnChange = this.validateOnChange.bind(this);
    this.logout = this.logout.bind(this);
    this.createRoom = this.createRoom.bind(this);
    this.sendMess = this.sendMess.bind(this);
    this.closeConversation = this.closeConversation.bind(this);
    this.viewRegister = this.viewRegister.bind(this);
    this.handleRegister = this.handleRegister.bind(this);
    this.handleInputFileChange = this.handleInputFileChange.bind(this);
    this.handleSendFile = this.handleSendFile.bind(this);
    this.initChat = this.initChat.bind(this);
    this.handleInputChangeCreateRoom = this.handleInputChangeCreateRoom.bind(this);
    this.renderChat = this.renderChat.bind(this);
    this.createWSClient = this.createWSClient.bind(this);
  }
  componentDidMount(){
    this.initChat();
  }

  schema = Joi.object().keys({
    username: Joi.string()
      .label("Username")
      .required(),
    password: Joi.string()
      .required()
      .label("Password")
  });

  validate() {
    const result = Joi.validate(
      { username: this.state.username, password: this.state.password },
      this.schema,
      { abortEarly: false }
    );

    if (result.error === null) return;

    const errors = {};

    for (let item of result.error.details) {
      errors[item.path[0]] = item.message;
    }
    return errors;
  }

  handleSubmit(e) {
    e.preventDefault();

    const errors = this.validate();

    this.setState({ errors: errors || {} });

    if (errors) return;

    console.log(errors);

    console.log("Form Submitted.");

    this.setState({ submitSuccessfully: true });

    const user = new URLSearchParams()
    user.append('username', this.state.username)
    user.append('password', this.state.password)

    axios.post('http://localhost:8080/auth/login', user,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        proxy: {
          host: '10.61.57.22',
          port: 3128
        }
      }).then(res => {
        console.log(res)
        if (res.data.Code == 1) {
          localStorage.setItem("token", res.data.Data)
          localStorage.setItem("username", this.state.username)
          this.setState({ authenticated: true, inRoom: true});
          this.setState({ password: "" });
          this.initChat();
        } else {
          alert(res.data.Message);
        }

      })
  }

  handleRegister(e) {
    e.preventDefault();

    // const errors = this.validate();

    // this.setState({ errors: errors || {} });

    // if (errors) return;

    // console.log(errors);

    // console.log("Form Submitted.");

    // this.setState({ submitSuccessfully: true });

    const user = new FormData()
    user.append('username', this.state.username)
    user.append('password', this.state.password)
    user.append('originalFile', this.state.image)


    axios.post('http://localhost:8080/auth/register', user,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        proxy: {
          host: '10.61.57.22',
          port: 3128
        }
      }).then(res => {
        console.log(res)

        if (res.data.Code == 1) {
          this.setState({ viewRegister: false, image: {} });
        } else {
          alert(res.data.Message);
        }
      })
  }

  validateOnChange(currentTarget) {
    const obj = { [currentTarget.name]: currentTarget.value };

    const res = this.schema._inner.children.filter(
      item => item.key === currentTarget.name
    );

    console.log(this.schema[currentTarget.name]);

    const schema = { [currentTarget.name]: res[0].schema };

    const { error } = Joi.validate({ obj }, schema);

    return error ? error.details[0].message : null;
  }

  logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    this.setState({ authenticated: false, inRoom: false });
  }

  createWSClient(roomName){
    const username = localStorage.getItem("username")
    ws = new WebSocket("ws://localhost:8080/ws?roomname=" + roomName + "&username=" + username)
    let token = localStorage.getItem("token")

    ws.onopen = () => {
      console.log("client in room " + roomName)
    }

    ws.onmessage = (event) => {
      var res = JSON.parse(event.data)
      console.log('receive new message' + res);

      if (res.Type === 'New User') {

      } else if (res.Type === 'Leave') {

      } else {
        let message = {
          "avatar": res.Avatar,
          "author": res.From,
          "content": res.Message,
          "isMine": false,
          "type": res.MessageType
        }

        this.handleMsgGroup(message);

        // message = '<b>' + res.From + '</b>: ' + res.Message 
      }

    }

    ws.onclose = () => {
      var message = '<b>me</b>: disconnected'
    }
  }

  createRoom() {

    // axios.post('http://localhost:8080/file/download' , {},
    //     {
    //       headers: {
    //         // 'Content-Type' : 'application/octet-stream'
    //         'Content-Type': 'multipart/form-data',
    //       },
    //       proxy: {
    //         host: '10.61.57.22',
    //         port: 3128
    //       }
    //     },
    //     {
    //       responseType: 'blob'
    //     }
    //     ).then(res => {
    //       // console.log(res)
    //       const url = window.URL.createObjectURL(new Blob([res.data]));
    //         const link = document.createElement("a");
    //         link.href = url;
    //         link.setAttribute("download", "file.PNG"); //or any other extension
    //         document.body.appendChild(link);
    //         link.click();
    //       // fileDownload(res.data, "test.xlsx");
    //       // const url = window.URL.createObjectURL(new Blob([res.data]));
    //       // const link = document.createElement('a');
    //       // link.href = url;
    //       // link.setAttribute('download', 'file.xlsx');
    //       // document.body.appendChild(link);
    //       // link.click();
    //     })

    // axios({
    //   url: 'http://localhost:8080/file/download',
    //   method: 'GET',
    //   responseType: 'blob', // important
    // }).then((response) => {
    //   const url = window.URL.createObjectURL(new Blob([response.data]));
    //   const link = document.createElement('a');
    //   link.href = url;
    //   link.setAttribute('download', 'file.png');
    //   document.body.appendChild(link);
    //   link.click();
    // });

    // const roomName = prompt('Room name');
    const roomName = "vipprodevno1"
    console.log(roomName);
    const username = localStorage.getItem("username")
    ws = new WebSocket("ws://localhost:8080/ws?roomname=" + roomName + "&username=" + username)
    let token = localStorage.getItem("token")

    ws.onopen = () => {

      axios.get('http://localhost:8080/user/info?username=' + username,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          proxy: {
            host: '10.61.57.22',
            port: 3128
          }
        }).then(res => {
          console.log(res)

          if (res.data.Code == 1) {
            this.setState({ avatarPath: res.data.Data.img_path })
          } else {
            alert(res.data.Message);
          }
        })

      // axios.get('http://localhost:8080/conv/get?roomname=' + roomName, 
      //   {
      //     headers: {
      //       'Content-Type': 'application/x-www-form-urlencoded'
      //     },
      //     proxy: {
      //       host: '10.61.57.22',
      //       port: 3128
      //     }
      //   }).then(res => {
      //     console.log(res)
      //     if(res.data.Code == 1) {

      //       let msgGroup = {
      //         "messages": [],
      //         "author" : ""
      //       }
      //       if(res.data.Data != null) {
      //         for (const mess of res.data.Data) {
      //           let message = {
      //             "avatar": mess.Author.Avatar,
      //             "author": mess.Author.Username,
      //             "content": mess.Content,
      //             "isMine": mess.Author.Username == username,
      //             "type": mess.Type
      //           }
      //           if(msgGroup.messages.length == 0){
      //             msgGroup = {
      //               "messages": [message],
      //               "author" : message.author,
      //               "isMine": message.author == username,
      //               "avatar": message.avatar
      //             }
      //           }
      //           else if(msgGroup.messages.length > 0 && message.author == msgGroup.author){
      //             msgGroup.messages.push(message)
      //           } else if(msgGroup.messages.length > 0 && message.author != msgGroup.author) {
      //             this.setState({messages: this.state.messages.concat(msgGroup)})
      //             msgGroup = {
      //               "messages": [message],
      //               "author" : message.author,
      //               "isMine": message.author == username,
      //               "avatar": message.avatar
      //             }
      //           }
      //         }
      //         this.setState({messages: this.state.messages.concat(msgGroup)})
      //       }

      //     }else {
      //       alert(res.data.Message);
      //     }

      //   })
      this.initChat();
      this.setState({ inRoom: true, roomName: roomName });
      console.log("Create new room")
    }

    ws.onmessage = (event) => {
      var res = JSON.parse(event.data)
      console.log('receive new message' + res);

      if (res.Type === 'New User') {

      } else if (res.Type === 'Leave') {

      } else {
        let message = {
          "avatar": res.Avatar,
          "author": res.From,
          "content": res.Message,
          "isMine": false,
          "type": res.MessageType
        }

        this.handleMsgGroup(message);

        // message = '<b>' + res.From + '</b>: ' + res.Message 
      }

    }

    ws.onclose = () => {
      var message = '<b>me</b>: disconnected'
    }
  }

  handleMsgGroup(message) {
    let msgGroup = {
      "messages": [],
      "author": "",
      "avatar": ""
    }
    let len = this.state.messages.length;
    if (len > 0) {
      msgGroup = this.state.messages[len - 1];
    }

    if (msgGroup.author == message.author) {
      msgGroup.messages.push(message)
      this.setState({ messages: this.state.messages })
    } else {
      msgGroup = {
        "messages": [message],
        "author": message.author,
        "isMine": message.author == this.state.username,
        "avatar": message.avatar
      }
      this.setState({ messages: this.state.messages.concat(msgGroup) })
    }

  }

  closeConversation() {
    this.setState({ inRoom: false })
  }

  handleInputChange({ currentTarget }) {
    // const errors = { ...this.state.errors };

    // const errorMessage = this.validateOnChange(currentTarget);

    // if (errorMessage) errors[currentTarget.name] = errorMessage;
    // else delete errors[currentTarget.name];

    this.setState({ [currentTarget.name]: currentTarget.value });
  }

  handleInputChangeCreateRoom(event) {

    this.setState({ [event.target.name]: event.target.value });
  }

  handleInputFileChange(event) {

    this.setState({ image: event.target.files[0] });
  }

  updateInputMess(inputMess) {
    this.setState({ inputMessage: inputMess });
    console.log('input: ' + this.state.inputMessage)
  }

  sendMess() {
    var messageRaw = document.querySelector('.publisher-input').value
    let message = {
      "author": this.state.username,
      "content": messageRaw,
      "isMine": true,
      "type": "text"
    }
    this.handleMsgGroup(message)
    console.log(messageRaw)
    ws.send(JSON.stringify({
      Message: messageRaw,
      Type: "text", 
      Room: this.state.currentRoom,
    }));
    document.querySelector('.publisher-input').value = ''
  }

  viewRegister(isViewRegister) {
    this.setState({ viewRegister: isViewRegister });
  }

  handleSendFile(event) {
    let fileUpload = event.target.files[0];
    const request = new FormData()
    request.append('originalFile', fileUpload)

    axios.post('http://localhost:8080/file/upload', request,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        proxy: {
          host: '10.61.57.22',
          port: 3128
        }
      }).then(res => {
        console.log(res)
        if (res.data.Code == 1) {
          let message = {
            "author": this.state.username,
            "content": res.data.Data,
            "isMine": true,
            "type": "file"
          }
          this.handleMsgGroup(message)
          ws.send(JSON.stringify({
            Message: res.data.Data,
            Type: "file",
            Room: this.state.currentRoom,
          }));
        } else {
          alert(res.data.Message);
        }

      })
  }
  initChat() {
    const username = localStorage.getItem("username")
    axios.get('http://localhost:8080/user/info?username=' + username,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          proxy: {
            host: '10.61.57.22',
            port: 3128
          }
        }).then(res => {
          console.log(res)

          if (res.data.Code == 1) {
            this.setState({ avatarPath: res.data.Data.img_path })
          } else {
            alert(res.data.Message);
          }
        })
    axios.get('http://localhost:8080/conv/get-all',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        proxy: {
          host: '10.61.57.22',
          port: 3128
        }
      }).then(res => {
        console.log(res)
        if (res.data.Code == 1) {
          if (res.data.Data != null) {
            this.setState({ listRoom: res.data.Data });
            for(let i = 0; i < res.data.Data.length; i ++) {
              const room = res.data.Data[i];
              if(room.Members.some(member => (member == username))){
                this.renderChat(i, room);
                this.setState({ inRoom: true, roomName: res.data.Data[i].Name});
                break;
              }
            };

            
          }

        } else {
          alert(res.data.Message);
        }

      })
  }

  renderChat(i, room) {
    let rooms = [...this.state.listRoom];
    rooms[i] = room;
    this.setState({listRoom: rooms});
    this.setState({ currentRoomIndex: i, currentRoom: room.Name, listMembers: room.Members, currentRoomObj: room });
    let msgGroupList = [];
    if (room.Messages != null && room.Messages.length > 0) {
      let msgGroup = {
        "messages": [],
        "author": ""
      }
      const username = localStorage.getItem("username")
      for (const mess of room.Messages) {
        let message = {
          "avatar": mess.Author.Avatar,
          "author": mess.Author.Username,
          "content": mess.Content,
          "isMine": mess.Author.Username == username,
          "type": mess.Type
        }
        if (msgGroup.messages.length == 0) {
          msgGroup = {
            "messages": [message],
            "author": message.author,
            "isMine": message.author == username,
            "avatar": message.avatar
          }
        }
        else if (msgGroup.messages.length > 0 && message.author == msgGroup.author) {
          msgGroup.messages.push(message)
        } else if (msgGroup.messages.length > 0 && message.author != msgGroup.author) {
          // this.setState({ messages: this.state.messages.concat(msgGroup) })
          msgGroupList.push(msgGroup);
          msgGroup = {
            "messages": [message],
            "author": message.author,
            "isMine": message.author == username,
            "avatar": message.avatar
          }
        }
      }
      if (msgGroup.messages.length > 0) {
        msgGroupList.push(msgGroup);
      }
    }
    
    this.setState({ messages: msgGroupList })
    this.closeCurrentWS();
    this.createWSClient(room.Name);
  }

  closeCurrentWS(){
    if(ws != undefined && ws != null)
      ws.close();
  }

  render() {
    if (!this.state.authenticated && !this.state.inRoom && !this.state.viewRegister) {
      return (

        <div>
          <h1 className="text-center">Login Form</h1>
          <form onSubmit={this.handleSubmit}>
            <FormInputs
              onChange={this.handleInputChange}
              errors={this.state.errors}
              value={this.state.username}
              htmlForId="username"
              type="text"
              label="Username"
            />
            <FormInputs
              onChange={this.handleInputChange}
              errors={this.state.errors}
              value={this.state.password}
              htmlForId="password"
              type="password"
              label="Password"
            />
            <div className="row">
              <div className="col-2" >
                <button style={{ width: '100%' }} disabled={this.validate()} className="btn btn-primary">
                  Login
                </button>
              </div>
              <div className="col-2" style={{ lineHeight: '33px' }}>
                <a onClick={() => this.viewRegister(true)} href="#">Register</a>
              </div>
            </div>

          </form>
        </div>


      );
    } else if (!this.state.authenticated && !this.state.inRoom && this.state.viewRegister) {
      return (

        <div>
          <h1 className="text-center">Register</h1>
          <form onSubmit={this.handleRegister}>
            <FormInputs
              onChange={this.handleInputChange}
              errors={this.state.errors}
              value={this.state.username}
              htmlForId="username"
              type="text"
              label="Username"
            />
            <FormInputs
              onChange={this.handleInputChange}
              errors={this.state.errors}
              value={this.state.password}
              htmlForId="password"
              type="password"
              label="Password"
            />
            <FormInputs
              onChange={this.handleInputFileChange}
              errors={this.state.errors}
              htmlForId="image"
              type="file"
              label="Avatar"
            />
            <div className="row">
              <div className="col-2" >
                <button style={{ width: '100%' }} disabled={this.validate()} className="btn btn-primary">
                  Register
                </button>
              </div>
              <div className="col-2" style={{ lineHeight: '33px' }}>
                <a onClick={() => this.viewRegister(false)} href="#">Login</a>
              </div>
            </div>

          </form>
        </div>


      );
    }

    else if (this.state.authenticated && this.state.inRoom) {
      return (
        < ChatContainer roomName={this.state.roomName} sendMess={this.sendMess} messages={this.state.messages} updateInputMess={this.updateInputMess}
          closeConversation={this.closeConversation} imagePath={this.state.avatarPath} handleSendFile={this.handleSendFile}
          listRoom={this.state.listRoom} currentRoom={this.state.currentRoom} currentRoomIndex={this.state.currentRoomIndex} 
          renderChat={this.renderChat} initChat={this.initChat} listMembers={this.state.listMembers} 
          currentRoomObj={this.state.currentRoomObj} logout={this.logout} />
      );
    } else {
      // return (
      //   < MessageContainer roomName = {this.state.roomName} sendMess = {this.sendMess} messages={this.state.messages} updateInputMess={this.updateInputMess} 
      //   closeConversation={this.closeConversation} imagePath={this.state.avatarPath} handleSendFile={this.handleSendFile}/>
      // );
      
    }

  }
}

export default LoginForm;
