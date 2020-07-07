import React from 'react';
import { Redirect } from 'react-router';
import { UserContext } from '../../../userContext';

const RedirectShop = () => (
  <UserContext.Consumer>
    {(context) => {
      if (context.id != null) {
        return (<Redirect to={`/magasin/${context.id}`} />);
      }

      return (<Redirect to="/introuvable" />);
    }}
  </UserContext.Consumer>
);


export default RedirectShop;
