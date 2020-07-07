import React from 'react';
import { Route, Link } from 'react-router-dom';
import styled from 'styled-components';
import { UserContext } from '../../userContext';

const PrivateRoute = ({ component: Component, ...rest }) => (
  <UserContext.Consumer>
    {context => (
      <Route
        render={
            props => (context.id !== null
              ? <Component {...props} />
              : (
                <Wrapper>
                  <header>
                    <div className="py-5 text-center">
                      <img className="d-block mx-auto mb-4" src="/logo/onvataiderx96.png" alt="Onvataider.com" width="72" height="72" />
                      <h2>Vous devez être connecté pour accéder à cette page.</h2>
                      <p>Si vous ne possédez pas déjà de compte, vous pouvez en ouvrir un simplement.</p>
                    </div>

                    <Link className="btn btn-primary" to="/connexion">Je me connecte</Link>
                  </header>
                </Wrapper>
              ))
          }
        {...rest}
      />
    )}
  </UserContext.Consumer>
);

export default PrivateRoute;

const Wrapper = styled.div`
    header {
        text-align: center;
        padding-top: 86px;
        padding-bottom: 24px;
        min-height: 342px;
    }
`;
