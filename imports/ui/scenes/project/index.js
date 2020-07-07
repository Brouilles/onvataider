import React, { Component } from 'react';
import MetaTags from 'react-meta-tags';
import { Meteor } from 'meteor/meteor';
import styled from 'styled-components';
import { withRouter, Link } from 'react-router-dom';
import {
  FacebookShareButton, TwitterShareButton, LinkedinShareButton,
} from 'react-share';
import {
  Container, Row, Col, Button, Badge, TabContent, TabPane, Nav, NavItem, NavLink,
  Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart, faClock, faBookmark, faPlay,
} from '@fortawesome/free-solid-svg-icons';
import {
  faFacebook, faTwitter, faLinkedin,
} from '@fortawesome/free-brands-svg-icons';
import 'react-quill/dist/quill.core.css';
import 'react-quill/dist/quill.snow.css';

function youtubeParser(url) {
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match[1];
}

class Project extends Component {
    state = {
      activeTab: '1',
      showThumbnailVideo: false,
      percentage: null,
      remainingTime: null,
      data: null,

      modal: false,
      modalRewardId: null,
      modalPrice: null,
    };

    componentDidMount() {
      const { history } = this.props;

      function parseDate(str) {
        const mdy = str.split('-');
        return new Date(mdy[2], mdy[0] - 1, mdy[1]);
      }

      function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
      }

      function datediff(first, second) {
        return Math.round((second - first) / (1000 * 60 * 60 * 24));
      }

      Meteor.call('getProjectByUrl', this.props.match.params.projectUrl, (error, result) => {
        if (error) { return history.push('/introuvable'); }

        const myDate = new Date();
        let remainingTime = datediff(parseDate(`${myDate.getMonth() + 1}-${myDate.getDate() + 1}-${myDate.getFullYear()}`), addDays(new Date(result.startDate), result.endDate));
        if (remainingTime < 0) remainingTime = 0;

        this.setState({
          data: result,
          percentage: (result.currentMoney / result.goal) * 100,
          remainingTime,
        });
      });
    }

    toggle = (tab) => {
      this.setState({ activeTab: tab });
    }

    modalToggle = (reward = null, price = null) => {
      const { data } = this.state;

      if (data.visibility !== 3) {
        this.setState({
          modal: !this.state.modal,
          modalRewardId: reward,
          modalPrice: price,
        });
      }
    }

    render() {
      const {
        activeTab, data, percentage, remainingTime, showThumbnailVideo,
        modal, modalRewardId, modalPrice,
      } = this.state;
      const { history } = this.props;

      if (data !== null) {
        document.title = `${data.name} - Onvataider.com`;

        const Support = ({ support }) => (
          <div className="card comment">
            <strong>Par {(support.creator != null ? `${support.creator.profile.name} ${support.creator.profile.familyName}` : 'Anonyme')} <small>- {support.amount}€</small></strong>
            <p>{support.comment || 'Pas de commentaire.'}</p>
          </div>
        );

        const Reward = ({ reward }) => (
          <li className="list-group-item">
            <Badge style={{ float: 'right' }} color="primary">Pour {reward.price}€ et plus</Badge>
            <h5>{reward.name}</h5>
            <p className="text-muted">{reward.content}</p>

            {reward.img != null && <img alt={reward.name} className="img-responsive" style={{ maxWidth: '100%' }} src={reward.img} />}

            <p className="text-muted">{reward.numberSales} <FontAwesomeIcon icon={faHeart} /> {reward.stock > -1 ? ` - Il en reste ${reward.stock} en réserve` : null}</p>
            <div className="text-center">
              {(data.visibility !== 3 && <Button color="primary" disabled={reward.stock !== -1 && reward.stock != null ? (!(reward.stock > 0)) : false} onClick={() => this.modalToggle(reward._id, reward.price)}>Choisir</Button>)}
            </div>
          </li>
        );

        const Product = ({ product }) => (
          <div className="col-md-4">
            <div className="card mb-4" style={{ padding: 0 }}>
              <img className="card-img-top" src={product.img} alt={product.name} />
              <div className="card-body">
                <h5 className="card-title" style={{ minHeight: '74px' }}>{product.name}
                  <br /><Badge color="primary">{product.price + product.transportCosts}€</Badge>
                </h5>
                <p className="card-text" style={{ height: '96px' }}>{product.description}</p>

                {data.visibility !== 3
                  ? product.stock > 0 ? <Link to={`/achat/${encodeURI(product.name)}/${product.price + product.transportCosts}/${encodeURI(product._id)}/${encodeURI(data._id)}/true`} className="btn btn-block btn-primary">J'achète</Link>
                    : <Button color="primary" disabled block>Plus de stock</Button>
                  : <Button color="primary" disabled block>Projet terminé</Button>}
              </div>
            </div>
          </div>
        );

        return (
          <Wrapper>
            <MetaTags>
              <title>{`${data.name}- Onvataider.com`}</title>
              <meta name="description" content={data.description} />
              <meta property="og:title" content={`${data.name} - Onvataider.com`} />
              <meta property="og:image" content={`https://onvataider.com${data.imgHeader}`} />
            </MetaTags>

            <div className="img-background-responsive" style={{ backgroundImage: `url(${data.imgHeader})` }} />
            <Container>
              <Row>
                <div id="container-header" className="col-12">
                  <div id="btn-group-social" className="btn-group">
                    <FacebookShareButton
                      url={window.location.href}
                      quote={`${data.name} - ${data.description}`}
                      className="btn btn-sm btn-outline-secondary btn-social btn-social-fb"
                    >
                      <FontAwesomeIcon icon={faFacebook} />
                    </FacebookShareButton>

                    <TwitterShareButton
                      url={window.location.href}
                      title={`${data.name} - ${data.description}`}
                      className="btn btn-sm btn-outline-secondary btn-social btn-social-twitter"
                    >
                      <FontAwesomeIcon icon={faTwitter} />
                    </TwitterShareButton>

                    <LinkedinShareButton
                      url={window.location.href}
                      title={`${data.name} - Onvataider.com`}
                      description={data.description}
                      className="btn btn-sm btn-outline-secondary btn-social btn-social-linkedin"
                    >
                      <FontAwesomeIcon icon={faLinkedin} />
                    </LinkedinShareButton>
                  </div>

                  <h1 className="text-center">{data.name}</h1>
                  <p className="text-center">{data.description}</p>
                </div>

                <div id="side-panel" className="col-md-4 order-md-2 mb-4">
                  <div className="card">
                    <div className="card-body">
                      {data.visibility === 3 && <Badge color="primary">Projet terminé</Badge>}

                      {data.hideMoney !== true
                        && (
                        <React.Fragment>
                          <h2>{data.currentMoney} € <small className="text-muted">collectés sur un objectif de {data.goal} €</small></h2>
                          <div className="progress" style={{ height: '24px', marginBottom: '6px' }}>
                            <div className={`progress-bar progress-bar-striped progress-bar-animated ${percentage > 100 ? 'bg-success' : null}`} role="progressbar" style={{ width: `${percentage}%` }} aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100" />
                          </div>
                          <hr />
                        </React.Fragment>
                        )
                      }

                      <div className="row">
                        {data.hideMoney !== true && <div className="col text-center">{parseInt(percentage, 10)}%</div> }
                        <div className="col text-center">{data.numberDonations} <FontAwesomeIcon icon={faHeart} /></div>
                        <div className="col text-center">J-{remainingTime} <FontAwesomeIcon icon={faClock} /></div>
                      </div>

                      {(data.visibility !== 3 && <><hr /><Button color="primary" onClick={() => this.modalToggle('42', 5)} block size="lg">Contribuer</Button></>)}
                    </div>
                  </div>

                  {data.creator
                    && (
                    <React.Fragment>
                      <h4 className="text-muted">Créateur</h4>
                      <div className="card">
                        <div className="card-body">
                          <h5>{data.creator.companyName ? data.creator.companyName : `${data.creator.name} ${data.creator.familyName}`}</h5>
                          <div className="row">
                            <div className="col-12 text-center"><FontAwesomeIcon icon={faBookmark} /> {data.creator.statistics.projectsCreated} projet(s) créé(s)</div>
                          </div>
                          <a href={data.creator.website} target="_blank" rel="noopener noreferrer">{data.creator.website}</a>
                        </div>
                      </div>
                    </React.Fragment>
                    )
                  }

                  <React.Fragment>
                    <h4 className="text-muted">Contreparties</h4>
                    <ul className="list-group mb-3">
                      {data.products && data.products.length > 0 && (
                        <li className="list-group-item">
                          <h5>Boutique solidaire.</h5>

                          <div className="text-center">
                            <Button
                              color="primary"
                              onClick={() => {
                                this.toggle('5');

                                const myDomNode = document.getElementById('solidarityShopDiv');
                                window.scrollTo(0, myDomNode.offsetTop);
                              }}
                            >Voir
                            </Button>
                          </div>
                        </li>
                      )}

                      {data.rewards && data.rewards.map(reward => <Reward key={reward._id} reward={reward} />)}

                      <li className="list-group-item">
                        <h5>Montant libre sans contreparties.</h5>
                        <p className="text-muted">Montant libre sans contreparties.</p>

                        <div className="text-center">
                          {(data.visibility !== 3 && <Button color="primary" onClick={() => this.modalToggle('42', 5)}>Choisir</Button>)}
                        </div>
                      </li>
                    </ul>
                  </React.Fragment>
                </div>

                <div className="col-md-8">
                  <div id="img-thumbnail">
                    <img onClick={() => { this.setState({ showThumbnailVideo: true }); }} alt={data.name} src={data.imgThumbnail} />
                    {(showThumbnailVideo && data.videoId ? <iframe width="560" height="315" src={`https://www.youtube.com/embed/${youtubeParser(data.videoId)}?rel=0&amp;showinfo=0;autoplay=1`} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen />
                      : (data.videoId && <FontAwesomeIcon icon={faPlay} onClick={() => { this.setState({ showThumbnailVideo: true }); }} />))}
                  </div>

                  <Nav tabs>
                    <NavItem>
                      <NavLink
                        className={(activeTab === '1' ? 'active' : null)}
                        onClick={() => this.toggle('1')}
                      >
                        Présentation
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={(activeTab === '2' ? 'active' : null)}
                        onClick={() => this.toggle('2')}
                      >
                        Mises à jour
                      </NavLink>
                    </NavItem>
                    {data.hideMoney !== true && (
                    <NavItem>
                      <NavLink
                        className={(activeTab === '4' ? 'active' : null)}
                        onClick={() => this.toggle('4')}
                      >
                        Contributeur(s)
                      </NavLink>
                    </NavItem>
                    )}
                    {data.products && data.products.length > 0 && (
                      <NavItem>
                        <NavLink
                          className={(activeTab === '5' ? 'active' : null)}
                          onClick={() => {
                            this.toggle('5');

                            const myDomNode = document.getElementById('solidarityShopDiv');
                            window.scrollTo(0, myDomNode.offsetTop);
                          }}
                        >
                          Boutique solidaire
                        </NavLink>
                      </NavItem>
                    )}
                  </Nav>

                  <TabContent activeTab={activeTab}>
                    <TabPane tabId="1">
                      <Row>
                        <Col className="description" sm="12">
                          <section className="ql-editor" dangerouslySetInnerHTML={{ __html: data.longDescription }} />
                        </Col>
                      </Row>
                    </TabPane>
                    <TabPane tabId="2">
                      <Row>
                        <Col className="description" sm="12">
                          <section className="ql-editor" dangerouslySetInnerHTML={{ __html: data.updateDescription }} />
                        </Col>
                      </Row>
                    </TabPane>
                    <TabPane tabId="4">
                      <Row>
                        <Col sm="12" style={{ paddingTop: '16px' }}>
                          {data.supports && data.supports.map(support => <Support key={support._id} support={support} />)}
                        </Col>
                      </Row>
                    </TabPane>
                    <TabPane tabId="5">
                      <Row id="solidarityShopDiv">
                        <Col sm="12" style={{ paddingTop: '16px' }}>
                          <h1 style={{ marginBottom: 0 }}>Boutique solidaire</h1>
                          <small style={{ marginTop: '-4px', marginBottom: '12px' }} className="form-text text-muted">Le montant de votre achat (hors frais de port) sera reversé à la cagnotte.</small>

                          <Row>
                            {data.products && data.products.length > 0 && data.products.map(product => <Product key={product._id} product={product} />)}
                          </Row>
                        </Col>
                      </Row>
                    </TabPane>
                  </TabContent>
                </div>
              </Row>
            </Container>
            <Modal isOpen={modal} size="lg">
              <ModalHeader toggle={() => this.modalToggle()}>Contribution</ModalHeader>
              <ModalBody>
                <strong>Étape 1:</strong> Indiquez le montant de votre contribution pour {data.name}
                <div className="row" style={{ marginTop: '16px' }}>
                  <div className="col-md-9">
                    <label className="font-weight-bold" htmlFor="reward">Niveau de contribution
                      <select ref={(input) => { this.rewardId = input; }} onChange={() => { this.currentPrice.value = (this.rewardId.value !== '42' ? data.rewards.find(x => x._id === this.rewardId.value).price : 5); }} defaultValue={modalRewardId} className="custom-select" id="reward">
                        <option value="42">Montant libre sans contreparties.</option>
                        {data.rewards.map(reward => <option key={reward._id} value={reward._id}>{reward.name}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="col-md-3">
                    <label className="font-weight-bold" htmlFor="reward">Total (€)
                      <input ref={(input) => { this.currentPrice = input; }} defaultValue={modalPrice} type="number" step="1" min="5" className="form-control" />
                    </label>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button onClick={() => history.push(`/achat/${encodeURI(data.name)}/${this.currentPrice.value}/${encodeURI(modalRewardId)}/${encodeURI(data._id)}`)} color="primary">Étape suivante</Button>
              </ModalFooter>
            </Modal>
          </Wrapper>
        );
      }

      return ('Chargement ...');
    }
}

export default withRouter(Project);

const Wrapper = styled.div`
  margin-top: 62px;

  .description {
    img { max-width: 100%; }
  }

  .img-background-responsive {
    width: 100%;
    height: 512px;
        
    background-repeat: no-repeat;
    background-position: center;
    background-attachment: fixed;
    background-size: cover; 
  }

  .container {
    transform: translateY(-150px);

    #container-header {
      background-color: white;
      border-left: 1px solid rgba(0, 0, 0, 0.125);
      border-right: 1px solid rgba(0, 0, 0, 0.125);
      border-top: 1px solid rgba(0, 0, 0, 0.125);
      padding-top: 15px; 

      min-height: 150px;
      margin-bottom: 6px;

      border-top-left-radius: calc(0.25rem - 1px);
      border-top-right-radius: calc(0.25rem - 1px);

      #btn-group-social {    
        .btn {
            width: 32px;
            height: 32px;
        }
      }

      p {
          max-width: 460px;
          margin: auto;
      }
    }

    #side-panel {
        h4 {
            margin-top: 24px;
        }
    }

    #img-thumbnail {
      position: relative;

      width: 100%;
      max-width: 755px;
      margin: auto;
      margin-bottom: 24px;

      img { width: 100%; cursor: pointer; }
      svg {
          cursor: pointer;
          position: absolute; 

          height: 100%; 
          width: calc(100% / 6); 
          left: 50%;
          top: 0;
          transform: translateX(-50%); 
                
          filter: drop-shadow(0px 0px 10px #000);
          path {
              color: white;
          }
      }

      iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
    }

    #comment-area {
      margin-top: 10px;
      form { margin-bottom: 24px; }
    }

    .card.comment {
      margin-bottom: 6px;
      padding: 12px;

      button { 
        position: absolute;
        right: 12px;
        width: 80px;
      }
      p { margin-bottom: 0; }
    }
  }

  @media screen and (max-width: 767px) {
    .container {
      #container-header {
        #btn-group-social { position: initial; }
      }
    }
  }

  @media (max-width: 576px) {
    .img-background-responsive { display: none; }
    .container { transform: translateY(0); }
  }
`;
