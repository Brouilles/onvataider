import React, { Component } from 'react';
import MetaTags from 'react-meta-tags';
import { withRouter, Link } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Container, Badge } from 'reactstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';

class Shop extends Component {
    state = {
      userData: null,
      products: null,
    };

    componentDidMount() {
      const { history } = this.props;

      Meteor.call('getUserProfile', this.props.match.params.userId, (error, result) => {
        if (error) { history.push('/introuvable'); }

        this.setState({
          userData: {
            ...result,
            name: (result.profile.companyName ? result.profile.companyName : `${result.profile.name} ${result.profile.familyName}`),
          },
        });
      });

      Meteor.call('getProductsByUser', this.props.match.params.userId, (error, result) => {
        if (error) { history.push('/introuvable'); }

        this.setState({ products: result });
      });
    }

    render() {
      const { userData, products } = this.state;

      if (userData != null && products != null) {
        const Product = ({ data }) => (
          <div className="col-md-4">
            <div className="card">
              <Link to={`/produit/${data.url}`}><img className="card-img-top" src={data.img} alt={data.name} /></Link>
              <div className="card-body">
                <h5 className="card-title">{data.name} <Badge color="primary">{data.price}€</Badge></h5>
                <p className="card-text">{data.description}</p>

                <Link to={`/produit/${data.url}`} className="btn btn-block btn-primary">Voir</Link>
              </div>
            </div>
          </div>
        );

        return (
          <Container id="main-content">
            <MetaTags>
              <title>{`${userData.name} - Onvataider.com`}</title>
              <meta name="description" content="Onvataider.com - Crowdfunding pour des projets participatifs sociaux et solidaires pour le handicap, les actions collectives et les collectes solidaires" />
              <meta property="og:title" content={`${userData.name} - Onvataider.com`} />
              <meta property="og:image" content="https://onvataider.com/banner.jpg" />
            </MetaTags>

            <div className="row">
              <h2 className="col-md-12">{userData.name}</h2>
              <p className="col-md-12">{userData.profile.biography}</p>

              <div className="col-md-12">
                {userData.profile.website && <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={userData.profile.website}>Site internet</a> }
                {'  '}
                {userData.profile.facebook && <a className="btn btn-primary btn-facebook" target="_blank" rel="noopener noreferrer" href={userData.profile.facebook}><FontAwesomeIcon icon={faFacebook} /></a> }
                {'  '}
                {userData.profile.instagram && <a className="btn btn-primary btn-instagram" target="_blank" rel="noopener noreferrer" href={userData.profile.instagram}><FontAwesomeIcon icon={faInstagram} /></a> }
              </div>

              <hr className="col-md-12" style={{ paddingRight: '15px', paddingLeft: '15px' }} />
              {products.map(product => <Product key={product._id} data={product} />)}
            </div>
          </Container>
        );
      }

      return ('Chargement ...');
    }
}

export default withRouter(Shop);
