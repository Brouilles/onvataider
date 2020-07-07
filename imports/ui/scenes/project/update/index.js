import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import {
  Container, Alert, Button, Nav, NavItem, NavLink, Badge, TabContent, TabPane, Row, Col, Table,
  Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import 'react-quill/dist/quill.snow.css';
import ReactQuill from 'react-quill';
import { withAlert } from '../../../components/alert';
import getBase64 from '../../../components/base64';

class UpdateProject extends Component {
    state = {
      activeTab: '1',
      removeRewardModalOpen: false,
      selectedId: 0,
      waitingRequest: false,
      waitingPublishRequest: false,

      categories: null,
      data: null,
      allDonatorsData: null,
      currentReward: null,
      type: null,
    }

    componentDidMount() {
      const { alert } = this.props;

      // Project
      Meteor.call('getProjectById', this.props.match.params.projectId, (error, result) => {
        if (error) { return alert.show('Erreur, le projet n\'existe pas ou plus', { type: 'error' }); }
        this.setState({ data: result });
      });

      // Categories
      Meteor.call('getCategories', (error, result) => {
        this.setState({ categories: result });
      });
    }

    getVisibiltyString = (e) => {
      switch (e) {
        case 0:
          return ['secondary', 'Brouillon'];
        case 1:
          return ['info', 'En attente de validation'];
        case 2:
          return ['success', 'En ligne'];
        case 3:
          return ['info', 'Fini'];
        case -1:
          return ['danger', 'Clos'];
        default: break;
      }
    }

    toggle = (tab) => {
      const { activeTab } = this.state;

      if (activeTab !== tab) {
        this.setState({
          activeTab: tab,
        });
      }
    }

    toggleRemoveReward = (id = 0, removeAction = false) => {
      const { data, removeRewardModalOpen, selectedId } = this.state;
      const { alert } = this.props;

      if (removeAction) {
        Meteor.call('removeReward', selectedId, (error) => {
          if (error) { return alert.show('Le compte n\'existe pas ou votre nom de compte / mot de passe est invalide.', { type: 'error' }); }

          alert.show('Le projet est maintenant supprimé.', { type: 'success' });
          this.setState({
            data: {
              ...data,
              rewards: data.rewards.filter(e => e._id !== selectedId),
            },
          });
        });
      }

      this.setState({
        removeRewardModalOpen: !removeRewardModalOpen,
        selectedId: id,
      });
    }

    formUpdateProject = (e) => {
      e.preventDefault();

      const { data } = this.state;
      const { alert } = this.props;

      this.setState({ waitingRequest: true });

      getBase64(this.headerImg.files[0]).then(
        (headerImg) => {
          getBase64(this.thumbnailImg.files[0]).then(
            thumbnailImg => Meteor.call('updateProject', {
              id: data._id,
              name: this.name.value,
              type: this.type.value,
              categoryId: this.category.value,
              imgHeader: headerImg,
              imgThumbnail: thumbnailImg,
              goal: parseInt(this.goal.value, 10),
              videoId: this.youtubeVideoId.value,
              description: this.description.value,
              longDescription: data.longDescription,
              updateDescription: data.updateDescription,
              endDate: parseInt(this.endDate.value, 10),
              hideMoney: this.hideMoney ? this.hideMoney.checked : false,
            }, (error) => {
              if (error) {
                this.setState({ waitingRequest: false });
                return alert.show(error.reason, { type: 'error' });
              }

              alert.show('Modification du projet réussie ! Bravo !', { type: 'success' });
              this.setState({ waitingRequest: false });
            }),
          );
        },
      );
    }

    loadReward = (id) => {
      const { data } = this.state;
      const { alert } = this.props;

      const result = data.rewards.find(e => e._id === id);
      if (result == null) { return alert.show('Impossible de trouver l\'élément en question.', { type: 'error' }); }

      document.getElementById('rewardName').value = result.name;
      document.getElementById('rewardPrice').value = result.price;
      document.getElementById('rewardDescription').value = result.content;
      this.setState({
        currentReward: result,
      });
    }

    exitEditReward = () => {
      document.getElementById('rewardName').value = '';
      document.getElementById('rewardPrice').value = '';
      document.getElementById('rewardDescription').value = '';
      this.setState({
        currentReward: null,
      });
    }

    formAddOrEditReward = (e) => {
      e.preventDefault();

      const { currentReward, data } = this.state;
      const { alert } = this.props;

      if (currentReward == null) { // Create
        getBase64(this.rewardThumbnailImg.files[0]).then((image) => {
          Meteor.call('createReward', {
            parentId: data._id,
            name: this.rewardName.value,
            content: this.rewardDescription.value,
            img: image,
            price: this.rewardPrice.value,
          }, (error, result) => {
            if (error) { return alert.show(error.reason, { type: 'error' }); }

            alert.show('Création de la contrepartie réussie !', { type: 'success' });

            this.setState({
              data: {
                ...data,
                rewards: [{
                  _id: result,
                  name: this.rewardName.value,
                  content: this.rewardDescription.value,
                  price: this.rewardPrice.value,
                  img: image,
                  numberSales: 0,
                }, ...data.rewards],
              },
            });

            this.rewardName.value = '';
            this.rewardDescription.value = '';
            this.rewardPrice.value = '';
            document.getElementById('inputFileReward').value = '';
          });
        });
      } else { // Update
        getBase64(this.rewardThumbnailImg.files[0]).then((image) => {
          Meteor.call('updateReward', {
            id: currentReward._id,
            name: this.rewardName.value,
            content: this.rewardDescription.value,
            img: image,
            price: this.rewardPrice.value,
          }, (error) => {
            if (error) { return alert.show(error.reason, { type: 'error' }); }

            const tempRewards = data.rewards;
            const foundIndex = data.rewards.findIndex(x => x._id === currentReward._id);
            tempRewards[foundIndex] = {
              _id: currentReward._id,
              name: this.rewardName.value,
              content: this.rewardDescription.value,
              img: image != null && image,
              price: this.rewardPrice.value,
            };

            this.setState({
              currentReward: null,
              data: {
                ...data,
                rewards: tempRewards,
              },
            });

            alert.show('Modification de la contrepartie réussie !', { type: 'success' });
            this.rewardName.value = '';
            this.rewardDescription.value = '';
            this.rewardPrice.value = '';
            document.getElementById('inputFileReward').value = '';
          });
        });
      }
    }

    loadDonators = () => {
      const { data } = this.state;
      const { alert } = this.props;

      Meteor.call('getAllProjectDonators', data._id, (error, result) => {
        if (error) { return alert.show(error.reason, { type: 'error' }); }

        this.setState({
          allDonatorsData: result,
        });
      });
    }

    publishProject = () => {
      const { data } = this.state;
      const { alert } = this.props;
      this.setState({ waitingPublishRequest: true });

      Meteor.call('waitingProject', data._id, (error, newVisibility) => {
        if (error) {
          this.setState({ waitingPublishRequest: false });
          return alert.show(error.reason, { type: 'error' });
        }

        this.setState(prevState => ({
          waitingPublishRequest: false,
          data: {
            ...prevState.data,
            visibility: newVisibility,
          },
        }));
      });
    }

    handleLongDescription = (value) => {
      const { data } = this.state;

      this.setState({
        data: {
          ...data,
          longDescription: value,
        },
      });
    }

    handleUpdateDescription = (value) => {
      const { data } = this.state;

      this.setState({
        data: {
          ...data,
          updateDescription: value,
        },
      });
    }

    render() {
      document.title = 'Modification d\'une cagnotte - Onvataider.com';
      const {
        activeTab, waitingRequest, waitingPublishRequest, data, allDonatorsData,
        categories, removeRewardModalOpen, currentReward, type,
      } = this.state;

      if (data != null) {
        const RewardRow = ({ row }) => (
          <tr>
            <td>{row.name}</td>
            <td>{row.price}€</td>
            <td>{row.numberSales}</td>
            <td className="text-right">
              <Button onClick={() => this.loadReward(row._id)} color="primary" size="sm">Modifier</Button> <Button onClick={() => this.toggleRemoveReward(row._id, false)} color="danger" size="sm">Supprimer</Button>
            </td>
          </tr>
        );

        return (
          <Container id="main-content">
            <div className="py-5 text-center">
              <img className="d-block mx-auto mb-4" src="/logo/onvataiderx96.png" alt="Onvataider.com" width="72" height="72" />
              <h2>{data.name} <small><Badge color={this.getVisibiltyString(data.visibility)[0]}>{this.getVisibiltyString(data.visibility)[1]}</Badge></small></h2>
              <p className="lead">Votre projet n'est pas encore en ligne, vous pouvez donc faire les modifications que vous souhaitez sur celui-ci.</p>
            </div>

            {(data.visibility === 1 && <Alert color="info">Le projet va être vérifié par un administrateur, puis mis en ligne si celui-ci est en règle. Vous recevrez un e-mail de confirmation quand le projet sera public.</Alert>)}

            <div className="text-right">
              <Link to={`/projet/${data.url}`} target="_blank" className="btn btn-primary">Voir</Link> {' '}
              {
                  data.visibility === 0
                    ? <Button onClick={this.publishProject} color="success">{waitingPublishRequest === true ? <FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" /> : 'Mettre en ligne'}</Button>
                    : (data.visibility === 1
                        && <Button onClick={this.publishProject} color="warning">{waitingPublishRequest === true ? <FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" /> : 'Annuler la mise en ligne'}</Button>)
              }

              {
                data.visibility >= 2
                  && (allDonatorsData !== null
                    ? <a download="donateurs.csv" className="btn btn-success" href={allDonatorsData}>Télécharger</a>
                    : <Button onClick={this.loadDonators} color="primary">Liste des donateurs</Button>
                  )
              }
            </div>

            <Nav tabs>
              <NavItem>
                <NavLink
                  className={(activeTab === '1' ? 'active' : null)}
                  onClick={() => { this.toggle('1'); }}
                >
                    Général
                </NavLink>
              </NavItem>
              {data.type < 2 && (
              <NavItem>
                <NavLink
                  className={(activeTab === '2' ? 'active' : null)}
                  onClick={() => { this.toggle('2'); }}
                >
                    Gestion des contreparties
                </NavLink>
              </NavItem>
              )}
            </Nav>

            <TabContent activeTab={activeTab}>
              <TabPane tabId="1">
                <Row>
                  <Col sm="12">
                    <form onSubmit={this.formUpdateProject}>
                      <h3>Général</h3>

                      <div className="form-group form-row">
                        <div className="col">
                          <label htmlFor="inputName">Nom de la cagnotte
                            <input defaultValue={data.name} ref={(input) => { this.name = input; }} id="inputName" maxLength="58" className="form-control" placeholder="Entrer le nom du projet" required type="text" />
                          </label>
                        </div>

                        <div className="col">
                          <label htmlFor="type">Type de cagnotte
                            <select onChange={input => this.setState({ type: input.target.value })} defaultValue={data.type} ref={(input) => { this.type = input; }} className="custom-select d-block w-100" id="type">
                              <option value="0">Projet (avec contreparties)</option>
                              <option value="2">Collecte solidaire (sans contreparties)</option>
                            </select>
                          </label>

                          { (type === '2' || data.type === 2)
                            && (
                            <div className="form-check">
                              <label className="form-check-label" htmlFor="hideMoney">
                                <input defaultChecked={data.hideMoney} type="checkbox" ref={(input) => { this.hideMoney = input; }} className="form-check-input" id="hideMoney" />
                                <small>Ne pas afficher le montant récolté</small>
                              </label>
                            </div>
                            )
                          }
                        </div>
                      </div>

                      <div className="form-group form-row">
                        <div className="col">
                          <label htmlFor="inputCategory">Catégorie
                            <select ref={(input) => { this.category = input; }} id="inputCategory" defaultValue={data.category} className="form-control">
                              {categories !== null && categories.map(row => <option selected={data.category === row._id ? 'true' : 'false'} key={row._id} value={row._id}>{row.name}</option>)}
                            </select>
                          </label>
                        </div>

                        <div className="col">
                          <label htmlFor="inputGoal">Objectif de financement
                            <input defaultValue={data.goal} ref={(input) => { this.goal = input; }} className="form-control" id="inputGoal" placeholder="Exemple: 1250" type="number" min="1" step="1" />
                            <small className="form-text text-muted">Le montant que vous espérez lever.</small>
                          </label>
                        </div>

                        <div className="col">
                          <label htmlFor="inputEndDate">Durée du projet
                            <input defaultValue={data.endDate} ref={(input) => { this.endDate = input; }} className="form-control" id="inputEndDate" min="1" step="1" type="number" />
                            <small className="form-text text-muted">Nombre de jours avant la fin du financement.</small>
                          </label>
                        </div>
                      </div>

                      <div className="form-group form-row">
                        <div className="col">
                          <label htmlFor="inputFileHeader">Image d'en-tête (format .jpg uniquement, 1920x1080 pixels)
                            <img alt="Header" style={{ maxWidth: '348px', display: 'block', margin: 'auto' }} src={data.imgHeader} /> <br />
                            <input id="inputFileHeader" ref={(input) => { this.headerImg = input; }} className="form-control" type="file" accept="image/jpeg" />
                          </label>
                        </div>

                        <div className="col">
                          <label htmlFor="inputFileThumbnail">Image vignette (format .jpg uniquement, 800x450 pixels)
                            <img alt="Thumbnail" style={{ maxWidth: '348px', display: 'block', margin: 'auto' }} src={data.imgThumbnail} /> <br />
                            <input id="inputFileThumbnail" ref={(input) => { this.thumbnailImg = input; }} className="form-control" type="file" accept="image/jpeg" />
                          </label>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="inputYoutubeVideoId">Vidéo Youtube de présentation (optionnel)
                          <input defaultValue={data.videoId} ref={(input) => { this.youtubeVideoId = input; }} className="form-control" placeholder="Exemple: https://www.youtube.com/watch?v=Ww4dqF-87_4" id="inputYoutubeVideoId" type="text" />
                        </label>
                      </div>

                      <div className="form-group">
                        <label htmlFor="inputDescription">Courte description
                          <textarea defaultValue={data.description} ref={(input) => { this.description = input; }} className="form-control" id="inputDescription" maxLength="140" rows="3" />
                          <small className="form-text text-muted">Utilisé dans la grille, domaines widget, et sur le formulaire d’achat (140 caractères maximum).</small>
                        </label>
                      </div>

                      <div className="form-group">
                        <label>Description detaillée</label>
                        <ReactQuill
                          value={data.longDescription}
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

                      <h3>Informations additionelles sur la campagne</h3>
                      <div className="form-group">
                        <label>Mises à jour du projet</label>
                        <ReactQuill
                          value={data.updateDescription}
                          onChange={this.handleUpdateDescription}
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

                      {(waitingRequest === true
                        ? <Button disabled color="primary" size="lg" block type="submit"><FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" />  <span className="align-middle">En cours ...</span></Button>
                        : <Button color="primary" size="lg" block type="submit">Modification du projet</Button>)}
                    </form>
                  </Col>
                </Row>
              </TabPane>
              <TabPane tabId="2">
                <Row>
                  <Col sm="12">
                    {data.type < 2 && (
                    <form onSubmit={this.formAddOrEditReward}>
                      <h3>{(currentReward != null ? "Modification d'une contrepartie" : "Création d'une contrepartie")}</h3>
                      <div className="form-group">
                        <label htmlFor="inputRewardName">Nom du projet
                          <input ref={(input) => { this.rewardName = input; }} id="rewardName" className="form-control" placeholder="Entrer le nom de la contrepartie" required type="text" />
                        </label>
                      </div>

                      <div className="form-group">
                        <label htmlFor="rewardDescription">Description
                          <textarea ref={(input) => { this.rewardDescription = input; }} id="rewardDescription" className="form-control" required maxLength="260" rows="3" />
                        </label>
                      </div>

                      <div className="form-group">
                        {currentReward != null && currentReward.img != null && <img alt="Présentation" style={{ maxWidth: '300px', display: 'block', margin: 'auto' }} src={currentReward.img} />}
                        <label htmlFor="inputFileReward">Image de présentation (optionnel, de préférence 300x167 pixels)
                          <input id="inputFileReward" ref={(input) => { this.rewardThumbnailImg = input; }} className="form-control" type="file" />
                        </label>
                      </div>

                      <div className="form-group">
                        <label htmlFor="inputRewardPrice">Prix
                          <input ref={(input) => { this.rewardPrice = input; }} className="form-control" id="rewardPrice" required placeholder="Exemple: 5" type="number" min="1" step="1" />
                        </label>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <Button color="primary" type="submit">{(currentReward != null ? 'Modification' : 'Ajout')} de la contrepartie</Button> {(currentReward != null ? <Button onClick={() => this.exitEditReward()}>Annuler</Button> : null)}
                      </div>
                    </form>
                    )}

                    <hr />

                    <Table striped>
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Prix</th>
                          <th>Nombre d'achats</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {data && data.rewards && data.rewards.map(row => <RewardRow key={row._id} row={row} />)}
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              </TabPane>
            </TabContent>

            <Modal isOpen={removeRewardModalOpen}>
              <ModalHeader toggle={() => this.toggleRemoveReward(null)}>Suppression d'un élément</ModalHeader>
              <ModalBody>
                        Voulez-vous vraiment supprimer cet élément ?
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onClick={() => this.toggleRemoveReward(null)}>Annuler</Button>{' '}
                <Button color="danger" onClick={() => this.toggleRemoveReward(null, true)}>Supprimer</Button>
              </ModalFooter>
            </Modal>
          </Container>
        );
      }

      return ('Chargement ...');
    }
}

export default withAlert(UpdateProject);
