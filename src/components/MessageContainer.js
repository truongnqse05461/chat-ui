import React, { Component } from "react";

import '../styles.css'
import '../message.css'

class MessageContainer extends Component {
    messagesEnd = undefined;
    baseHost = "http://localhost:8080";
    constructor() {
        super();

        this.state = {
            imgModal: "",
            showModal: false,
          };
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.closeConversation = this.closeConversation.bind(this);
        this.openFileExplore = this.openFileExplore.bind(this);
        this.handleOpenImage = this.handleOpenImage.bind(this);
        this.closeModal = this.closeModal.bind(this);
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
    closeConversation(){
        this.props.closeConversation()
    }
    openFileExplore(){
        this.inputElement.click();
    }
    handleOpenImage(event){
        this.setState({showModal: true, imgModal: event.target.src});
    }
    closeModal(){
        this.setState({showModal: false, imgModal: ''});
    }
  render() {
    const messages = this.props.messages;
    const listMessage = messages.map((mess, i, arr) => (        
        <div className={!mess.isMine ? "media media-chat" : "media media-chat media-chat-reverse"} > 
        {!mess.isMine ? <img  className="avatar" src={this.baseHost + mess.avatar} alt="..."/> : '' }
            <div className="media-body">
                        
            {mess.messages.map(msgObj => msgObj.type == "file"
                ? 
                    <img onClick={this.handleOpenImage} style={{ cursor: "pointer" }}  src={this.baseHost + msgObj.content} alt="..." />
                : <p>{msgObj.content}</p>
            )}
            {!mess.isMine ? <span>({mess.author})</span> : ''}          
            </div>
        </div>
    ))
    return (
        <div className="page-content page-container" id="page-content" >
            <div className="padding">
                <div className="row container d-flex justify-content-center">
                    <div className="col-md-6">
                        <div className="card card-bordered">
                            <div className="card-header">
                                <h4 className="card-title"><strong>{this.props.roomName}</strong></h4> <a onClick={this.closeConversation} className="btn btn-xs btn-secondary" href="" data-abc="true"><i className="fas fa-times"></i></a>
                            </div>
                            <div className="ps-container ps-theme-default ps-active-y" id="chat-content">
                                

                                {listMessage}
                                <div style={{ float:"left", clear: "both" }}
                                    ref={(el) => { this.messagesEnd = el; }}>
                                </div>
                                
                            </div>
                            <div className="publisher bt-1 border-light">
                                 <img className="avatar avatar-xs" src={this.baseHost + this.props.imagePath} alt="..."/>
                                  <input onKeyDown={this.handleKeyDown} className="publisher-input" type="text" placeholder="Write something"/> <span className="publisher-btn file-group"> 
                                      <i onClick={this.openFileExplore} className="fa fa-paperclip file-browser"></i>
                                       <input onChange={this.props.handleSendFile} ref={input => this.inputElement = input} type="file"/> </span>
                                        <a className="publisher-btn" href="#" data-abc="true">
                                           <i className="fa fa-smile"></i></a>
                                            <a onClick={this.props.sendMess} className="publisher-btn text-info" data-abc="true"><i className="fa fa-paper-plane"></i></a> 
                                        </div>
                        </div>
                    </div>
                </div>
            </div>
            <div style={{display: this.state.showModal ? 'block' : 'none'}} className="modal">
                <span onClick={this.closeModal} className="close">&times;</span>
            
                <img className="modal-content" src={this.state.imgModal}/>
            
                <div id="caption"></div>
            </div>
        </div>
        
      );
  }
}

export default MessageContainer; 
