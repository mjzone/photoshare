import React, { Component } from "react";
import { Auth } from "aws-amplify";
import { Input, Menu } from "semantic-ui-react";
import { withRouter } from "react-router-dom";

export class Navigation extends Component {
  state = { activeItem: "feed" };

  componentDidMount = async () => {
    const { username } = await Auth.currentUserInfo();
    this.setState({ username });
  };
  handleMenuClick = (e, { name }) => {
    const path = name === "feed" ? "/" : "/albums";
    this.setState({ activeItem: name });
    this.props.history.push(path);
  };

  render() {
    const { activeItem, username } = this.state;
    return (
      <div>
        <Menu pointing>
          <Menu.Item name="feed" active={activeItem === "feed"} onClick={this.handleMenuClick} />
          <Menu.Item name={username} active={activeItem === username} onClick={this.handleMenuClick} />
          <Menu.Menu position="right">
            <Menu.Item>
              <Input icon="search" placeholder="Search..." />
            </Menu.Item>
          </Menu.Menu>
        </Menu>
        {this.props.children}
      </div>
    );
  }
}

export default withRouter(Navigation);
