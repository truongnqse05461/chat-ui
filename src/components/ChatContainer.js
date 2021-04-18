import React, { Component } from "react";

import axios from "axios";
import ReactTooltip from 'react-tooltip';

import '../chat.css';
import '../styles.css';
import '../message.css';
import '../modal.css';

// var ws = undefined;

var selectedRoom = {};
var selectedRoomIndex = 0;

class ChatContainer extends Component {
    messagesEnd = undefined;
    baseHost = "http://localhost:8080";
    constructor() {
        super();

        this.state = {
            imgModal: "",
            showModal: false,
            roomName: "",
            password: "",
            image: "",
            showMembers: false,
            onlyPassword: false,
        };
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.closeConversation = this.closeConversation.bind(this);
        this.openFileExplore = this.openFileExplore.bind(this);
        this.handleOpenImage = this.handleOpenImage.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleInputFileChange = this.handleInputFileChange.bind(this);
        this.createNewRoom = this.createNewRoom.bind(this);
        this.openShowMembers = this.openShowMembers.bind(this);
        this.openCreateRoomModal = this.openCreateRoomModal.bind(this);
        this.joinChat = this.joinChat.bind(this);
        this.logout = this.logout.bind(this);
    }
    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({ behavior: "smooth" });
    }

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }
    handleKeyDown(e) {
        if (e.key === 'Enter') {
            this.props.sendMess()
        }
    }
    closeConversation() {
        this.props.closeConversation()
    }
    openFileExplore() {
        this.inputElement.click();
    }
    handleOpenImage(event) {
        this.setState({ showModal: true, imgModal: event.target.src });
    }
    closeModal() {
        this.setState({ showModal: false, imgModal: '' });
        this.setState({ showMembers: false });
    }
    handleInputChange(event) {
        this.setState({ [event.target.name]: event.target.value });
    }
    handleInputFileChange(event) {
        this.setState({ image: event.target.files[0] });
    }
    handleOpenChat(i, room) {
        selectedRoom = room;
        selectedRoomIndex = i;
        const username = localStorage.getItem("username")
        this.setState({ roomName: room.Name })
        if (room.Password != "" && !room.Members.some(member => (member === username))) {
            this.setState({ onlyPassword: true })
            const link = document.createElement('a');
            link.href = "#createRoom";
            link.setAttribute('data-toggle', 'modal');
            document.body.appendChild(link);
            link.click();
        } else {
            this.getMessagesByRoom(i, room.Name);
            // this.props.renderChat(i, room);
        }
    }
    createNewRoom() {
        const username = localStorage.getItem("username")
        const user = new FormData()
        user.append('username', username)
        user.append('roomname', this.state.roomName)
        user.append('password', this.state.password)
        user.append('originalFile', this.state.image)


        axios.post('http://localhost:8080/conv/create', user,
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
                    this.setState({ roomName: "", password: "", image: "" })

                    const closeBtn = document.querySelector('#createRoom .close')
                    closeBtn.click();
                    this.props.initChat();

                } else {
                    alert(res.data.Message);
                }

            })
    }

    joinChat() {
        const username = localStorage.getItem("username")
        const user = new FormData()
        user.append('username', username)
        user.append('roomname', this.state.roomName)
        user.append('password', this.state.password)


        axios.post('http://localhost:8080/conv/join', user,
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
                    this.setState({ roomName: "", password: "", image: "" })
                    const closeBtn = document.querySelector('#createRoom .close')
                    closeBtn.click();
                    // this.props.renderChat(selectedRoomIndex, selectedRoom);
                    this.getMessagesByRoom(selectedRoomIndex, selectedRoom.Name);

                } else {
                    alert(res.data.Message);
                }

            })
    }

    openCreateRoomModal() {
        this.setState({ onlyPassword: false, roomName: "" })
        const link = document.createElement('a');
        link.href = "#createRoom";
        link.setAttribute('data-toggle', 'modal');
        document.body.appendChild(link);
        link.click();
    }
    openShowMembers() {
        this.setState({ showMembers: true })
    }

    getMessagesByRoom(index, roomName) {
        axios.get('http://localhost:8080/conv/get?roomname=' + roomName,
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
                    this.props.renderChat(index, res.data.Data);

                } else {
                    alert(res.data.Message);
                }
            })
    }
    logout(){
        this.props.logout()
    }

    render() {
        const rooms = this.props.listRoom;
        const listRoomRender = rooms.map((room, i, arr) => (
            <li onClick={() => this.handleOpenChat(i, room)} className={i == this.props.currentRoomIndex ? "clearfix active" : "clearfix"}>
                <img src={room.RoomAvatar != "" ? this.baseHost + room.RoomAvatar : "https://bootdey.com/img/Content/avatar/avatar2.png"} alt="avatar" />
                <div className="about">
                    <div className="name">{room.Name}</div>
                    <div className="status"> 
                    {/* <i className="fa fa-circle online" />  */}
                    {room.Members.length} members
                     </div>
                </div>
            </li>
        ))
        const messages = this.props.messages;
        const listMessage = messages.map((mess, i, arr) => (
            <div className={!mess.isMine ? "media media-chat" : "media media-chat media-chat-reverse"} >
                {!mess.isMine ? <img className="avatar" src={this.baseHost + mess.avatar} alt="..." /> : ''}
                <div className="media-body">

                    {mess.messages.map(msgObj => msgObj.type == "file"
                        ?
                        <img onClick={this.handleOpenImage} style={{ cursor: "pointer" }} src={this.baseHost + msgObj.content} alt="..." />
                        : <p>{msgObj.content}</p>
                    )}
                    {!mess.isMine ? <span>({mess.author})</span> : ''}
                </div>
            </div>
        ))
        return (
            <div className="row clearfix">
                <div className="col-lg-12">
                    <div className="card chat-app">
                        <div id="plist" className="people-list">
                            <div className="input-group">
                                <a onClick={this.logout} style={{cursor: "pointer"}} data-abc="true">
                                    <i data-tip data-for="logoutToolTip" className="fas fa-sign-out-alt fa-rotate-180"></i>
                                </a>
                                <ReactTooltip id="logoutToolTip" place="top" effect="solid">
                                    Logout
                                </ReactTooltip>
                                <div className="input-group-prepend">
                                    <span onClick={this.openCreateRoomModal} style={{ borderRadius: '.25rem', cursor: 'pointer' }} className="input-group-text">
                                        <i data-tip data-for="createRoomToolTip" className="fa fa-plus" />
                                    </span>
                                    <ReactTooltip id="createRoomToolTip" place="top" effect="solid">
                                        Create Room
                                </ReactTooltip>
                                </div>
                                {/* <input type="text" className="form-control" placeholder="Room name..." /> */}
                            </div>
                            <ul className="list-unstyled chat-list mt-2 mb-0">
                                {listRoomRender}
                            </ul>
                        </div>
                        <div className="chat">
                            <div className="row d-flex justify-content-center chat-container">
                                <div className="col-md-12">
                                    <div className="card card-bordered message-container">
                                        <div className="card-header" style={{display: "block"}}>
                                            <img style={{float: "left"}} src={this.props.currentRoomObj.RoomAvatar != "" ? this.baseHost + this.props.currentRoomObj.RoomAvatar : "https://bootdey.com/img/Content/avatar/avatar2.png"} alt="avatar" />
                                            <div style={{width: "fit-content", float: "left"}}>
                                            <h4 className="card-title"><strong>{this.props.currentRoom}</strong></h4>
                                            </div>
                                            
                                            <div style={{ position: "relative", float: "right" }}>
                                                <a onClick={this.openShowMembers} >
                                                    <i data-tip data-for="membersToolTip" className="fas fa-users"></i>
                                                </a>
                                                <ReactTooltip id="membersToolTip" place="top" effect="solid">
                                                    Room Members
                                                </ReactTooltip>
                                                <div style={{ display: this.state.showMembers ? 'block' : 'none' }} className="modal modal-members">
                                                    <span onClick={this.closeModal} className="close close-btn-members">
                                                        &times;
                                                    </span>

                                                    <div className="member-list">
                                                        <ul className="list-unstyled chat-list mt-2 mb-0">
                                                            {
                                                                this.props.listMembers.map(member => (
                                                                    <li className="clearfix">
                                                                        <img src="https://bootdey.com/img/Content/avatar/avatar1.png" alt="avatar" />
                                                                        <div className="about">
                                                                            <div className="name">{member}</div>
                                                                            {/* <div className="status"> <i className="fa fa-circle offline" /> left 7 mins ago </div> */}
                                                                        </div>
                                                                    </li>
                                                                ))
                                                            }
                                                        </ul>
                                                    </div>

                                                </div>
                                            </div>
                                            {/* 
                                            <a onClick={this.closeConversation} href="" data-abc="true">
                                            <i className="fas fa-sign-out-alt"></i></a> */}


                                        </div>
                                        <div className="ps-container ps-theme-default ps-active-y" id="chat-content">


                                            {listMessage}
                                            <div style={{ float: "left", clear: "both" }}
                                                ref={(el) => { this.messagesEnd = el; }}>
                                            </div>

                                        </div>
                                        <div className="publisher bt-1 border-light">
                                            <img className="avatar avatar-xs" src={this.baseHost + this.props.imagePath} alt="..." />
                                            <input name="chat" onKeyDown={this.handleKeyDown} className="publisher-input" type="text" placeholder="Write something" /> <span className="publisher-btn file-group">
                                                <i onClick={this.openFileExplore} className="fa fa-paperclip file-browser"></i>
                                                <input onChange={this.props.handleSendFile} ref={input => this.inputElement = input} type="file" /> </span>
                                            <a className="publisher-btn" href="#" data-abc="true">
                                                <i className="fa fa-smile"></i></a>
                                            <a onClick={this.props.sendMess} className="publisher-btn text-info" data-abc="true"><i className="fa fa-paper-plane"></i></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="createRoom" className="modal fade">
                    <div className="modal-dialog modal-login">
                        <div className="modal-content">
                            <div className="modal-header">
                                {!this.state.onlyPassword
                                    ? <h4 className="modal-title">Create Room</h4>
                                    : <h4 className="modal-title">{this.state.roomName}</h4>}
                                <button type="button" className="close" data-dismiss="modal" aria-hidden="true">×</button>
                            </div>
                            <div className="modal-body">
                                {!this.state.onlyPassword && (<div className="form-group">
                                    <i className="fas fa-comments"></i>
                                    <input onChange={this.handleInputChange} type="text" name="roomName" className="form-control" placeholder="Room name" required="required" />
                                </div>)}
                                <div className="form-group">
                                    <i className="fa fa-lock" />
                                    <input onChange={this.handleInputChange} type="password" name="password" className="form-control" placeholder="Password" />
                                </div>
                                {!this.state.onlyPassword && (<div className="form-group">
                                    <i className="fas fa-image"></i>
                                    <input onChange={this.handleInputFileChange} type="file" name="image" className="form-control" />
                                </div>)}
                                <div className="form-group">
                                    <input onClick={!this.state.onlyPassword ? this.createNewRoom : this.joinChat} type="submit" className="btn btn-primary btn-block btn-lg" defaultValue="Create" />
                                </div>
                            </div>
                            {/* <div className="modal-footer">
                                <a href="#">Forgot Password?</a>
                            </div> */}
                        </div>
                    </div>
                </div>
                <div style={{ display: this.state.showModal ? 'block' : 'none' }} className="modal">
                    <span onClick={this.closeModal} className="close">&times;</span>

                    <img className="modal-content" src={this.state.imgModal} />

                    <div id="caption"></div>
                </div>

            </div>

        );
    }
}

export default ChatContainer;