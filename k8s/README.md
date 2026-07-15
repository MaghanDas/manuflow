# ManuFlow on Kubernetes (Minikube-friendly)

Bare manifests — no Helm, no kustomize — so the whole stack is readable in
one pass. Applies cleanly to Minikube or any small cluster.

## Quickstart (Minikube)

```bash
minikube start

# Build the three images inside Minikube's Docker daemon so the
# imagePullPolicy: IfNotPresent manifests can find them locally.
eval $(minikube docker-env)
docker build -t manuflow-backend:latest ./backend
docker build -t manuflow-frontend:latest ./frontend
docker build -t manuflow-notifications:latest ./notifications

kubectl apply -f k8s/00-postgres.yaml
kubectl apply -f k8s/10-notifications.yaml
kubectl apply -f k8s/20-backend.yaml
kubectl apply -f k8s/30-frontend.yaml

kubectl -n manuflow get pods -w
```

Once the backend pod is ready, seed demo data the same way the Docker
Compose entrypoint does:

```bash
kubectl -n manuflow exec deploy/backend -- python manage.py seed_demo_data
```

Then open the frontend:

```bash
minikube service frontend -n manuflow
```

## Notes

- `manuflow-secrets` in `00-postgres.yaml` holds the DB credentials and
  Django secret key in plaintext for local use — swap for a real secrets
  manager (AWS Secrets Manager, GCP Secret Manager, Sealed Secrets) before
  this touches a shared cluster.
- The frontend image is built with `VITE_API_URL=http://localhost:8000/api`
  baked in at build time (see `frontend/Dockerfile`). On a real cluster,
  rebuild it with `--build-arg VITE_API_URL=https://your-domain/api`
  pointed at wherever you expose the backend Service (Ingress, LoadBalancer,
  etc.) — Vite env vars are compiled in, not read at runtime.
- `backend` and `frontend` run 2 replicas each; `postgres` and
  `notifications` run 1. Socket.io needs sticky sessions or a Redis adapter
  to scale past one notifications replica — out of scope for this build.
