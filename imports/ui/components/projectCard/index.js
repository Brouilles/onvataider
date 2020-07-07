import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FacebookShareButton, TwitterShareButton } from 'react-share';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faClock } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faTwitter } from '@fortawesome/free-brands-svg-icons';

const ProjectCard = ({
  thumbnail, name, description, link, percentage, paymentsCount, cooldown, creatorName, type, hideMoney,
}) => (
  <Wrapper className="col-md-4">
    <div className="card project-card mb-4">
      <Link to={`/projet/${link}`}><img className="card-img-top" style={{ height: '225px', width: '100%', display: 'block' }} alt="Thumbnail [100%x225]" src={thumbnail} data-holder-rendered="true" /></Link>
      <div className="card-body">
        <Link to={`/projet/${link}`} style={{ textDecoration: 'none', color: 'initial' }}>
          <h3>{name}</h3>
          <p className="card-text">{description}</p>

          {hideMoney !== true
            ? (
              <div className="progress">
                <div className={`progress-bar ${percentage >= 100 ? 'bg-success' : null}`} role="progressbar" style={{ width: `${percentage}%` }} aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">{(percentage > 10 ? `${parseInt(percentage, 10)}%` : null)}</div>
              </div>
            ) : (
              <div style={{ height: '24px', marginBottom: '6px' }} />
            )
          }
        </Link>


        <div className="d-flex justify-content-between align-items-center">
          <div className="btn-group">
            <Link to={`/projet/${link}`} className="btn btn-sm btn-outline-secondary">
              {(cooldown !== 0 ? 'Contribuer' : 'Voir')}
            </Link>

            <FacebookShareButton
              url={`https://onvataider.com/projet/${link}`}
              quote={`${name} - ${description}`}
              className="btn btn-sm btn-outline-primary btn-social btn-social-fb"
            >
              <FontAwesomeIcon icon={faFacebook} />
            </FacebookShareButton>

            <TwitterShareButton
              url={link}
              title={`${name} | Onvataider.com`}
              className="btn btn-sm btn-outline-primary btn-social btn-social-twitter"
            >
              <FontAwesomeIcon icon={faTwitter} />
            </TwitterShareButton>
          </div>

          <small className="text-muted">{paymentsCount} <FontAwesomeIcon icon={faHeart} /> &nbsp; {(cooldown !== 0 ? `J-${cooldown}` : 'Fini')} <FontAwesomeIcon icon={faClock} /></small>
        </div>

        <div className="row">
          <div className=" col-5 text-left">
            <small className="text-muted">
              {type < 2 ? 'Projet' : 'Collecte solidaire'}
            </small>
          </div>

          <div className="creator col text-right">
            <small title={creatorName} className="text-muted">Par {creatorName}</small>
          </div>
        </div>
      </div>
    </div>
  </Wrapper>
);

export default ProjectCard;

const Wrapper = styled.div`  
  @media (min-width: 992px) {
    h3 {
      height: 99px;
    }

    .card-text {
      height: 96px;
      overflow: hidden;
    }

    .progress {
      height: 24px
      margin-bottom: 6px;
    }

    .creator {
      overflow: hidden;
      height: 24px;
    }
  }
`;
