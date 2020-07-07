import React, { Component } from 'react';
import MetaTags from 'react-meta-tags';
import { withRouter, Link } from 'react-router-dom';
import {
  FacebookShareButton, TwitterShareButton, LinkedinShareButton,
} from 'react-share';
import {
  Container, Row, Badge, Button,
} from 'reactstrap';
import { Meteor } from 'meteor/meteor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFacebook, faTwitter, faLinkedin,
} from '@fortawesome/free-brands-svg-icons';
import Select from 'react-select';

class Product extends Component {
    state = {
      data: null,
      selectedProject: null,
    }

    componentDidMount() {
      const { history } = this.props;

      Meteor.call('getProductByUrl', this.props.match.params.productId, (error, result) => {
        if (error) { history.push('/introuvable'); }

        this.setState({ data: result });
      });
    }

    handleChange = (selectedProject) => {
      this.setState({ selectedProject });
    }

    render() {
      const { data, selectedProject } = this.state;

      if (data !== null) {
        document.title = `${data.name} - Onvataider.com`;

        return (
          <Container id="main-content">
            <MetaTags>
              <title>{`${data.name}- Onvataider.com`}</title>
              <meta name="description" content={data.description} />
              <meta property="og:title" content={`${data.name} - Onvataider.com`} />
              <meta property="og:image" content={`https://onvataider.com${data.img}`} />
            </MetaTags>

            <Row>
              <div className="col-md-12">
                <h1>{data.name}</h1>
                <h5>De <Link to={`/magasin/${data.creator._id}`}>{data.creator.profile.companyName ? data.creator.profile.companyName : `${data.creator.profile.name} ${data.creator.profile.familyName}`}</Link></h5>
              </div>

              <div className="col-md-8">
                <img alt={data.name} src={data.img} style={{ width: '100%' }} />
              </div>

              <div className="col-md-4">
                <div className="card">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-12 bottom-rule">
                        <h2 className="product-price">{data.price}€ <small>+ {data.transportCosts}€ de frais de port dont {data.donation}€ reversé à la cagnotte.</small></h2>
                      </div>
                    </div>

                    <Badge className="form-group" color="success">{data.stock} exemplaire(s) en stock</Badge>

                    {data.selectedProjects && data.selectedProjects.length > 0 ? (
                      <React.Fragment>
                        <div className="form-group">
                          <label aria-label="Projet à soutenir">
                            <Select
                              placeholder="Choisir un projet solidaire ..."
                              value={selectedProject}
                              onChange={this.handleChange}
                              options={data.selectedProjects}
                            />
                            <small className="form-text text-muted">Vous devez choisir ci-dessus, la cagnotte que vous voulez soutenir en achetant cet article.</small>
                          </label>
                        </div>

                        <small>Estimation du délai de livraison: {data.deliveryTime ? `${data.deliveryTime} jour(s)` : 'Inconnu'}</small>
                        {data.stock > 0
                          ? <Link disabled to={`/achat/${encodeURI(data.name)}/${data.price + data.transportCosts}/${encodeURI(data._id)}/${encodeURI(selectedProject && selectedProject.value)}/true`} className={`btn btn-block btn-primary ${selectedProject == null && 'disabled'}`}>J'achète</Link>
                          : <Button color="primary" disabled block>Plus de stock</Button> }
                      </React.Fragment>
                    )
                      : <Button color="primary" disabled block>Non disponible à la vente</Button>}
                  </div>
                </div>

                <div id="btn-group-social" className="btn-group" style={{ marginTop: '6px' }}>
                  <FacebookShareButton
                    url={window.location.href}
                    quote={data.name}
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
              </div>

              <div className="col-md-12" style={{ marginTop: '12px' }}>
                <strong>Description:</strong>
                <p>{data.longDescription}</p>
              </div>
            </Row>
          </Container>
        );
      }

      return ('Chargement ...');
    }
}

export default withRouter(Product);
