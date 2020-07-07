/* eslint-disable */
import React, { createContext, Component } from 'react';
import { Tracker } from 'meteor/tracker';

export const UserContext = createContext();

class UserProvider extends Component {
    state = {
      id: null,
      name: null,
      roles: null,
    };

    componentDidMount() {
      Tracker.autorun(() => {
        if (Meteor.user()) {
          this.setState({
            id: Meteor.user()._id,
            name: Meteor.user().profile.name,
            roles: Meteor.user().roles
          });
        } else {
          this.setState({
            id: null,
            name: null,
            roles: null
          });
        }
      });
    }

    render() {
      return (
        <UserContext.Provider value={this.state}>
          {this.props.children}
        </UserContext.Provider>
      );
    }
}

export default UserProvider;
