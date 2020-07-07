import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';
import styled from 'styled-components';

const NoMatch = () => {
  document.title = 'Page introuvable - Onvataider.com';

  return (
    <Wrapper>
      <header>
        <div className="py-5 text-center">
          <img className="d-block mx-auto mb-4" src="/logo/onvataiderx96.png" alt="Onvataider.com" width="72" height="72" />
          <h2>La page que vous demandez est introuvable.</h2>
          <p>Oups, cette page n&apos;existe pas.</p>
        </div>

        <Link className="btn btn-primary" to="/">Retour à l&apos;accueil</Link>
      </header>
    </Wrapper>
  );
};

export default NoMatch;

const Wrapper = styled(Container)`
    header {
        text-align: center;
        padding-top: 86px;
        padding-bottom: 24px;
        min-height: 342px;
    }
`;
