import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';
import { withRouter } from 'react-router-dom';
import { Container, Button, Alert } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import 'react-quill/dist/quill.snow.css';
import ReactQuill from 'react-quill';
import getBase64 from '../../../components/base64';
import { withAlert } from '../../../components/alert';


class CreateProject extends Component {
    state = {
      waitingRequest: false,
      longDescription: null,
      categories: null,
      type: null,
    }

    componentDidMount() {
      Meteor.call('getCategories', (error, result) => {
        this.setState({ categories: result });
      });
    }

    handleLongDescription = (value) => {
      this.setState({
        longDescription: value,
      });
    }

    createProject = (e) => {
      e.preventDefault();
      const { longDescription } = this.state;
      const { history, alert } = this.props;

      this.setState({ waitingRequest: true });

      getBase64(this.headerImg.files[0]).then(
        (headerImg) => {
          getBase64(this.thumbnailImg.files[0]).then(
            thumbnailImg => Meteor.call('createProject', {
              name: this.name.value,
              type: this.type.value,
              categoryId: this.category.value,
              imgHeader: headerImg,
              imgThumbnail: thumbnailImg,
              goal: parseInt(this.goal.value, 10),
              videoId: this.youtubeVideoId.value,
              description: this.description.value,
              longDescription,
              updateDescription: '',
              endDate: parseInt(this.endDate.value, 10),
              hideMoney: this.hideMoney ? this.hideMoney.checked : false,
            }, (error, result) => {
              if (error) { return alert.show(error.reason, { type: 'error' }); }

              alert.show('Création du projet réussie ! Bravo !', { type: 'success' });
              history.push(`/edition-projet/${result}`); // Redirect
            }),
          );
        },
      );
    }

    render() {
      document.title = 'Création d\'une cagnotte - Onvataider.com';
      const {
        categories, waitingRequest, longDescription, type,
      } = this.state;

      return (
        <Container id="main-content">
          <div className="py-5 text-center">
            <img className="d-block mx-auto mb-4" src="/logo/onvataiderx96.png" alt="Onvataider.com" width="72" height="72" />
            <h2>Création d'une cagnotte</h2>
            <p className="lead">Vous avez un projet à nous soumettre ? Une collecte à organiser ? Merci de remplir ce petit formulaire, 5 minutes suffisent ! Cela nous permet de faire connaissance avec votre projet et vous ! <strong>Toutes les informations renseignées ici seront modifiables par la suite.</strong></p>
          </div>

          <form onSubmit={this.createProject}>
            <div className="form-group form-row">
              <div className="col">
                <label htmlFor="inputName">Nom de la cagnotte
                  <input ref={(input) => { this.name = input; }} id="inputName" maxLength="58" className="form-control" placeholder="Entrer le nom du projet" required type="text" />
                </label>
              </div>

              <div className="col">
                <label htmlFor="type">Type de cagnotte
                  <select onChange={input => this.setState({ type: input.target.value })} ref={(input) => { this.type = input; }} className="custom-select d-block w-100" id="type">
                    <option value="0">Projet (avec contreparties)</option>
                    <option value="2">Collecte solidaire (sans contreparties)</option>
                  </select>
                </label>

                { type === '2'
                  && (
                  <div className="form-check">
                    <label className="form-check-label" htmlFor="hideMoney">
                      <input type="checkbox" ref={(input) => { this.hideMoney = input; }} className="form-check-input" id="hideMoney" />
                      <small>Ne pas afficher le montant récolté</small>
                    </label>
                  </div>
                  )
                }
              </div>
            </div>

            <div className="form-group form-row">
              <div className="col">
                <label htmlFor="inputFileHeader">Image d'en-tête (format .jpg uniquement, 1920x1080 pixels)
                  <input id="inputFileHeader" ref={(input) => { this.headerImg = input; }} className="form-control" required type="file" accept="image/jpeg" />
                </label>
              </div>

              <div className="col">
                <label htmlFor="inputFileThumbnail">Image vignette (format .jpg uniquement, 800x450 pixels)
                  <input id="inputFileThumbnail" ref={(input) => { this.thumbnailImg = input; }} className="form-control" required type="file" accept="image/jpeg" />
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="inputCategory">Catégorie
                <select ref={(input) => { this.category = input; }} id="inputCategory" className="form-control">
                  {categories !== null && categories.map(row => <option key={row._id} value={row._id}>{row.name}</option>)}
                </select>
              </label>
            </div>

            <div className="form-group form-row">
              <div className="col">
                <label htmlFor="inputGoal">Objectif de financement
                  <input ref={(input) => { this.goal = input; }} className="form-control" id="inputGoal" placeholder="Exemple: 1250" type="number" min="1" step="1" />
                  <small className="form-text text-muted">Le montant que vous espérez lever.</small>
                </label>
              </div>

              <div className="col">
                <label htmlFor="inputEndDate">Durée du projet
                  <input ref={(input) => { this.endDate = input; }} className="form-control" id="inputEndDate" min="1" step="1" type="number" />
                  <small className="form-text text-muted">Nombre de jours avant la fin du financement.</small>
                </label>
              </div>

              <div className="col">
                <label htmlFor="inputYoutubeVideoId">Vidéo Youtube de présentation (optionnel)
                  <input ref={(input) => { this.youtubeVideoId = input; }} className="form-control" placeholder="Exemple: https://www.youtube.com/watch?v=Ww4dqF-87_4" id="inputYoutubeVideoId" type="text" />
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="inputDescription">Courte description
                <textarea ref={(input) => { this.description = input; }} className="form-control" id="inputDescription" maxLength="140" rows="3" />
                <small className="form-text text-muted">Utilisé dans la grille, domaines widget, et sur le formulaire d’achat (140 caractères maximum).</small>
              </label>
            </div>

            <div className="form-group">
              <label>Description detaillée</label>
              <ReactQuill
                value={longDescription}
                onChange={this.handleLongDescription}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }, { align: [] }],
                    ['link', 'image'],
                    ['clean'],
                  ],
                }}
              />
            </div>

            <Alert color="info" style={{ marginTop: '24px' }}>
                Important: L'ajout des contreparties se fait à l'étape suivante.
            </Alert>

            {(waitingRequest === true
              ? <Button disabled color="primary" size="lg" block type="submit"><FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" />  <span className="align-middle">En cours de création ...</span></Button>
              : <Button color="primary" size="lg" block type="submit">Suivant</Button>)}
          </form>
        </Container>
      );
    }
}

export default withAlert(withRouter(CreateProject));
