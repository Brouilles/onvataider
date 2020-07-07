import React, { Component } from 'react';
import MetaTags from 'react-meta-tags';
import { Link } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import {
  Container, Badge, Button, ButtonGroup, ButtonToolbar,
} from 'reactstrap';

export default class index extends Component {
    state = {
      search: null,
      products: null,
      page: 0,
      numberOfPage: 0,
      categories: null,
      categoryUrl: null,
    };

    componentDidMount() {
      this.setState({ categoryUrl: this.props.match.params.category }, this.updateData);

      // Categories
      Meteor.call('getProductCategories', (error, result) => {
        this.setState({ categories: result });
      });
    }

    componentWillReceiveProps(newProps) {
      this.setState({
        categoryUrl: newProps.match.params.category,
        page: 0,
      }, this.updateData);
    }

    searchChange = () => {
      this.setState({ search: this.searchInput.value }, this.updateData);
    }

    changePage = (number) => {
      this.setState({ page: number }, this.updateData);
    }

    updateData = () => {
      const { page, categoryUrl, search } = this.state;

      Meteor.call('getProducts', {
        limit: 9,
        skip: page * 9,
        filter: search,
        categoryUrl,
      }, (error, result) => {
        this.setState({ products: result });
      });

      Meteor.call('productsCount', {
        filter: search,
        categoryUrl,
      }, (error, result) => {
        const tempArray = [];

        for (let i = 0; i < result; i += 9) { tempArray.push(i / 9); }
        this.setState({ numberOfPage: tempArray });
      },
      );
    }

    render() {
      const { categories, products, numberOfPage } = this.state;

      const Product = ({ data }) => (
        <div className="col-md-4">
          <div className="card mb-4">
            <Link to={`/produit/${data.url}`}><img className="card-img-top" src={data.img} alt={data.name} /></Link>
            <div className="card-body">
              <h5 className="card-title" style={{ minHeight: '74px' }}>
                {data.name}
                <br /><Badge color="primary">{data.price + data.transportCosts}€</Badge>
                <br /><small>De <Link to={`/magasin/${data.creator._id}`}>{ data.creator.profile.companyName ? data.creator.profile.companyName : `${data.creator.profile.name} ${data.creator.profile.familyName}` }</Link></small>
              </h5>
              <p className="card-text" style={{ height: '96px' }}>{data.description}</p>

              <Link to={`/produit/${data.url}`} className="btn btn-block btn-primary">Voir</Link>
            </div>
          </div>
        </div>
      );

      return (
        <Container id="main-content">
          <MetaTags>
            <title>Ventes solidaires - Onvataider.com</title>
            <meta name="description" content="Onvataider.com - Crowdfunding pour des projets participatifs sociaux et solidaires pour le handicap, les actions collectives et les collectes solidaires" />
            <meta property="og:title" content="Ventes solidaires - Onvataider.com" />
            <meta property="og:image" content="https://onvataider.com/banner.jpg" />
          </MetaTags>

          <div className="row">
            <h1 className="col-md-12" style={{ textAlign: 'center', marginBottom: '56px' }}>
              Ventes solidaires <br />
              <small>au profit d'un projet ou d'une cagnotte solidaire</small>
            </h1>

            <div className="form-group col-md-12">
              <input ref={(input) => { this.searchInput = input; }} onChange={this.searchChange} style={{ marginBottom: '6px' }} type="text" className="form-control" placeholder="Rechercher" />
              <span style={{ marginRight: '6px' }}>Trier par:</span>
              <div className="btn-group" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                {categories && categories.map(row => <Link className="btn btn-primary btn-sm" key={row._id} to={`/produits/${row.url}`}>{row.name}</Link>)}
                <Link className="btn btn-primary btn-sm" to="/produits">Aucun</Link>
              </div>
            </div>

            {products && products.map(product => <Product key={product._id} data={product} />)}

            <div className="col-12 text-center" style={{ marginTop: 16 }}>
              <ButtonToolbar style={{ display: 'inline-block' }}>
                <ButtonGroup>
                  { numberOfPage && numberOfPage.map(data => <Button onClick={() => this.changePage(data)} key={`buttonPage_${data}`} color="primary">{data + 1}</Button>)}
                </ButtonGroup>
              </ButtonToolbar>
            </div>
          </div>
        </Container>
      );
    }
}
