import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Container, Button, Alert } from 'reactstrap';
import { Meteor } from 'meteor/meteor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import Select from 'react-select';
import getBase64 from '../../../components/base64';
import { withAlert } from '../../../components/alert';

class ProductForm extends Component {
  state = {
    id: null,
    image: null,
    visibility: null,
    selectedProjects: null,
    solidarityProjects: null,

    categories: null,
    waitingPublishRequest: false,
    waitingRequest: false,
  }

  componentDidMount() {
    if (this.props.match.params.productId != null) { this.loadProductData(); }

    Meteor.call('getProductCategories', (error, result) => {
      this.setState({ categories: result });
    });

    Meteor.call('getSolidarityProjects', (error, result) => {
      this.setState({
        solidarityProjects: result,
      });
    });
  }

  handleChange = (selectedProjects) => {
    this.setState({ selectedProjects });
  }

  loadProductData = () => {
    const { alert } = this.props;

    Meteor.call('getProductById', this.props.match.params.productId, (error, result) => {
      if (error) { return alert.show(error.message, { type: 'error' }); }

      this.name.value = result.name;
      this.price.value = result.price;
      this.donation.value = result.donation || 0;
      this.delivery.value = result.transportCosts;
      this.description.value = result.description;
      this.longDescription.value = result.longDescription;
      this.stock.value = result.stock;
      this.deliveryTime.value = result.deliveryTime;

      this.setState({
        id: result._id,
        selectedProjects: result.selectedProjects,
        image: result.img,
        visibility: result.visibility,
      });
    });
  }

  publishProduct = () => {
    const { id } = this.state;
    const { alert } = this.props;
    this.setState({ waitingPublishRequest: true });

    Meteor.call('waitingProduct', id, (error, newVisibility) => {
      if (error) { return alert.show(error.message, { type: 'error' }); }

      this.setState({
        waitingPublishRequest: false,
        visibility: newVisibility,
      });
    });
  }

  formCreateOrUpdateProduct = (e) => {
    e.preventDefault();
    const { id, selectedProjects } = this.state;
    const { alert, history } = this.props;
    this.setState({ waitingRequest: true });

    if (id == null) { // Create
      getBase64(this.thumbnailImg.files[0]).then((image) => {
        Meteor.call('createProduct', {
          name: this.name.value,
          selectedProjects,
          price: parseFloat(this.price.value),
          donation: parseFloat(this.donation.value),
          categoryId: this.category.value,
          transportCosts: parseFloat(this.delivery.value),
          img: image,
          description: this.description.value,
          longDescription: this.longDescription.value,
          stock: parseInt(this.stock.value, 10),
          deliveryTime: parseInt(this.deliveryTime.value, 10),
        }, (error) => {
          this.setState({ waitingRequest: false });
          if (error) { return alert.show(error.message, { type: 'error' }); }

          alert.show('Création du brouillon réussie !', { type: 'success' });
          history.push('/tableau-de-bord');
        });
      });
    } else { // Update
      getBase64(this.thumbnailImg.files[0]).then((image) => {
        Meteor.call('updateProduct', {
          id,
          name: this.name.value,
          selectedProjects,
          price: parseFloat(this.price.value),
          donation: parseFloat(this.donation.value),
          categoryId: this.category.value,
          transportCosts: parseFloat(this.delivery.value),
          img: image,
          description: this.description.value,
          longDescription: this.longDescription.value,
          stock: parseInt(this.stock.value, 10),
          deliveryTime: parseInt(this.deliveryTime.value, 10),
        }, (error) => {
          this.setState({ waitingRequest: false });
          if (error) { return alert.show(error.message, { type: 'error' }); }

          alert.show('Modification du produit réussie !', { type: 'success' });
        });
      });
    }
  }

  removeProduct = () => {
    const { id } = this.state;
    const { alert } = this.props;

    Meteor.call('invisibilityProduct', id, (error, newVisibility) => {
      if (error) { return alert.show(error.message, { type: 'error' }); }

      this.setState({
        visibility: newVisibility,
      });
    });
  }

  render() {
    document.title = 'Produit - Onvataider.com';
    const {
      image, visibility, waitingPublishRequest, waitingRequest, selectedProjects, solidarityProjects, categories,
    } = this.state;

    return (
      <Container id="main-content">
        <div className="py-5 text-center">
          <img className="d-block mx-auto mb-4" src="/logo/onvataiderx96.png" alt="Onvataider.com" width="72" height="72" />
          <h2>Création d'un article pour la boutique</h2>
          <p className="lead">Créez votre annonce, choisissez la ou les cagnottes pour laquelle l'argent sera reversé (aucuns frais appliqués aux vendeurs).</p>
        </div>

        {visibility === 0 && <Alert color="info">L'article va être vérifié par un administrateur, puis mis en ligne si celui-ci est en règle. Vous recevrez un e-mail de confirmation quand le projet sera public.</Alert>}

        <div className="text-right">
          {(visibility === -1 ? <Button onClick={() => this.publishProduct()} color="success">{waitingPublishRequest === true ? <FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" /> : 'Mettre en ligne'}</Button>
            : (visibility === 0 && <Button onClick={() => this.publishProduct()} color="warning">{waitingPublishRequest === true ? <FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" /> : 'Annuler la mise en ligne'}</Button>)
          )}

          {visibility === 1 && <Button onClick={this.removeProduct} color="warning">Ne plus vendre</Button>}
          {visibility === -2 && <Button onClick={this.removeProduct} color="warning">Re-mettre en vente</Button>}
        </div>

        <form onSubmit={this.formCreateOrUpdateProduct}>
          <div className="form-group">
            <label htmlFor="inputName">Nom du produit
              <input ref={(input) => { this.name = input; }} id="inputName" maxLength="66" className="form-control" required type="text" />
            </label>
          </div>

          <div className="form-group form-row">
            <div className="col">
              <label htmlFor="inputPrice">Prix total
                <input ref={(input) => { this.price = input; }} id="inputPrice" className="form-control" required type="number" step="0.01" min="5" />
              </label>
            </div>

            <div className="col">
              <label htmlFor="inputDonation">Montant reversé à la cagnotte
                <input ref={(input) => { this.donation = input; }} id="inputDonation" className="form-control" required type="number" step="0.01" min="5" />
                <small className="form-text text-muted">Doit être inférieur au prix total.</small>
              </label>
            </div>

            <div className="col">
              <label htmlFor="inputDelivery">Frais de livraison
                <input ref={(input) => { this.delivery = input; }} id="inputDelivery" className="form-control" required type="number" step="0.01" min="0" />
                <small className="form-text text-muted">S'additionne au prix total.</small>
              </label>
            </div>
          </div>

          <div className="form-group form-row">
            <div className="col">
              <label htmlFor="inputStock">Nombre en stock
                <input ref={(input) => { this.stock = input; }} id="inputStock" className="form-control" required type="number" step="1" min="1" />
              </label>
            </div>

            <div className="col">
              <label htmlFor="inputDeliveryTime">Délai de livraison <small>(En jours)</small>
                <input ref={(input) => { this.deliveryTime = input; }} id="inputDeliveryTime" className="form-control" required type="number" step="1" min="1" />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="inputFileThumbnail">Image vignette (format .jpg / .jpeg uniquement)
              {image && <img alt="Thumbnail" src={image} style={{ maxWidth: '348px', display: 'block', margin: 'auto' }} /> }<br />
              <input id="inputFileThumbnail" ref={(input) => { this.thumbnailImg = input; }} className="form-control" required={this.props.match.params.productId == null && true} type="file" accept="image/jpeg" />
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="inputDescription">Description
              <textarea ref={(input) => { this.description = input; }} required className="form-control" id="inputDescription" maxLength="140" rows="3" />
              <small className="form-text text-muted">Utilisé dans la liste des contreparties (140 caractères maximum).</small>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="inputLongDescription">Description longue
              <textarea ref={(input) => { this.longDescription = input; }} required className="form-control" id="inputLongDescription" rows="3" />
              <small className="form-text text-muted">Utilisé sur la page du produit.</small>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="inputCategory">Catégories de projet
              <select ref={(input) => { this.category = input; }} id="inputCategory" className="form-control">
                {categories !== null && categories.map(row => <option key={row._id} value={row._id}>{row.name}</option>)}
              </select>
            </label>
          </div>

          <div className="form-group">
            <label>Projets solidaires
              {solidarityProjects
                && (
                <Select
                  isMulti
                  placeholder="Choisir des projets ..."
                  value={selectedProjects}
                  onChange={this.handleChange}
                  options={solidarityProjects}
                />
                )
              }
              <small className="form-text text-muted">Vous devez choisir pour quelle(s) cagnotte(s) l'argent sera reversé (si vous en choisissez plusieurs, c'est le client solidaire qui choisira la cagnotte concernée lors de son achat).</small>
            </label>
          </div>

          {(waitingRequest === true
            ? <Button disabled color="primary" size="lg" block><FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" />  <span className="align-middle">En cours ...</span></Button>
            : <Button color="primary" size="lg" block type="submit">{(this.props.match.params.productId == null ? 'Création de l\'article' : 'Modification')}</Button>)}
        </form>
      </Container>
    );
  }
}

export default withAlert(withRouter(ProductForm));
