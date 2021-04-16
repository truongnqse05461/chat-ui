import React from "react"
import PropTypes from 'prop-types'

const Message = ({message, author}) => (
	<li class="message">
        <div class="avatar">{author}</div>
        <div class="text_wrapper">
            <div class="text">{message}</div>
        </div>
    </li>
	)

Message.propTypes = {
	message: PropTypes.string.isRequired,
	author: PropTypes.string.isRequired
}
export default Message; 